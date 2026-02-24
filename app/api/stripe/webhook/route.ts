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
        // Need to fetch PI to get payment_method.
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
      }
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
