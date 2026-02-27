import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message || err}` },
      { status: 400 }
    );
  }

  // Idempotency: Stripe retries webhooks.
  try {
    await prisma.stripeWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch {
    // already processed
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;

      // A) Booking deposit checkout
      const bookingId = session?.metadata?.bookingId as string | undefined;
      const paymentId = session?.metadata?.paymentId as string | undefined;
      const paymentIntentId = session?.payment_intent as string | undefined;
      const stripeCustomerId = session?.customer as string | undefined;

      if (bookingId && paymentIntentId) {
        // Mark the deposit payment captured.
        if (paymentId) {
          await prisma.payment.updateMany({
            where: { id: paymentId, bookingId },
            data: { status: "CAPTURED", paymentIntentId },
          });
        } else {
          await prisma.payment.updateMany({
            where: { bookingId, type: "DEPOSIT" },
            data: { status: "CAPTURED", paymentIntentId },
          });
        }

        // Save payment method for off-session remainder charge.
        try {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          const pm = (pi as any)?.payment_method as string | null | undefined;
          await prisma.booking.updateMany({
            where: { id: bookingId },
            data: {
              stripeCustomerId: stripeCustomerId || null,
              stripePaymentMethodId: pm || null,
            },
          });
        } catch {
          // non-fatal
        }

        // Receipt SMS (once)
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { customer: true, provider: true, payments: true },
          });
          const deposit = booking?.payments?.find((p) => p.type === "DEPOSIT");
          if (booking?.customer?.phone && deposit) {
            const claimed = await prisma.payment.updateMany({
              where: { id: deposit.id, receiptSmsSentAt: null },
              data: { receiptSmsSentAt: new Date() },
            });
            if (claimed.count > 0) {
              const { sendPaymentReceiptSMS } = await import("@/lib/receipts");
              await sendPaymentReceiptSMS({
                to: booking.customer.phone,
                amountCents: deposit.amountCents,
                kind: "Deposit",
                bookingId: booking.id,
                providerName: booking.provider?.displayName,
              });
            }
          }
        } catch {
          // ignore
        }

        break;
      }

      // B) Tech subscription checkout
      const kind = session?.metadata?.kind as string | undefined;
      const providerId = session?.metadata?.providerId as string | undefined;
      const subscriptionId = session?.subscription as string | undefined;

      if (kind === "tech_subscription" && providerId && stripeCustomerId && subscriptionId) {
        await prisma.provider.updateMany({
          where: { id: providerId },
          data: {
            stripeCustomerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionActive: true,
            active: true,
          },
        });
      }

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      const subId = sub.id as string;
      const customerId = sub.customer as string;
      const status = sub.status as string;
      const active = status === "active" || status === "trialing";

      await prisma.provider.updateMany({
        where: {
          OR: [{ stripeSubscriptionId: subId }, { stripeCustomerId: customerId }],
        },
        data: {
          stripeSubscriptionId: subId,
          stripeCustomerId: customerId,
          subscriptionActive: active,
          active: active,
        },
      });
      break;
    }

    case "account.updated": {
      const acct = event.data.object as any;
      const id = acct.id as string;
      await prisma.provider.updateMany({
        where: { stripeAccountId: id },
        data: {
          stripeChargesEnabled: !!acct.charges_enabled,
          stripePayoutsEnabled: !!acct.payouts_enabled,
        },
      });
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as any;
      const id = pi.id as string;
      await prisma.payment.updateMany({
        where: { paymentIntentId: id },
        data: { status: "CAPTURED" },
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as any;
      const id = pi.id as string;
      await prisma.payment.updateMany({
        where: { paymentIntentId: id },
        data: { status: "VOIDED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
