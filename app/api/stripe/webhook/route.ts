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
    return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message || err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const bookingId = session?.metadata?.bookingId;
      const paymentIntentId = session?.payment_intent as string | undefined;
      if (bookingId && paymentIntentId) {
        await prisma.payment.updateMany({
          where: { booking: { id: bookingId } },
          data: { status: "AUTHORIZED", paymentIntentId },
        });
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
      // When we capture later, the PI will succeed.
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
