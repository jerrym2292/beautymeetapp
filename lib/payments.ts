import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

function cents(n: number) {
  return Math.max(0, Math.round(n));
}

// Charge the remaining balance after completion (deposit already captured).
// Policy:
// - Deposit is already captured via Checkout.
// - Remainder is charged off-session using the saved payment method.
// - If provider has Stripe Connect account, attempt destination charge + application fee.
export async function chargeRemainderForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      provider: true,
      payments: true,
    },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.completedAt) return;
  if (booking.issueReportedAt) throw new Error("Issue reported; remainder charge paused");

  const depositPayment = booking.payments.find((p) => p.type === "DEPOSIT");
  if (!depositPayment || depositPayment.status !== "CAPTURED") {
    throw new Error("Deposit not captured");
  }

  const subtotalCents = booking.servicePriceCents + booking.travelFeeCents;

  // Deposit base is (deposit - its processing fee). We recompute remaining from policy:
  // remainder base = subtotal - depositBase
  // Since booking.depositCents includes processing fee, estimate deposit base = deposit / 1.03.
  const depositBaseApprox = cents(booking.depositCents / 1.03);
  const remainingBaseCents = Math.max(0, subtotalCents - depositBaseApprox);
  const remainderStripeFeeCents = cents(remainingBaseCents * 0.03);
  const remainderTotalCents = remainingBaseCents + remainderStripeFeeCents;

  // Already charged?
  const existingRemainder = booking.payments.find((p) => p.type === "REMAINDER");
  if (existingRemainder && existingRemainder.status === "CAPTURED") {
    // Mark completed (safety)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", completedAt: booking.completedAt ?? new Date() },
    });
    return;
  }

  if (remainderTotalCents <= 0) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return;
  }

  if (!booking.stripeCustomerId || !booking.stripePaymentMethodId) {
    throw new Error("Missing saved payment method");
  }

  const stripe = getStripe();

  // Create/ensure remainder Payment record
  const remainderPayment =
    existingRemainder ||
    (await prisma.payment.create({
      data: {
        bookingId: booking.id,
        type: "REMAINDER",
        status: "REQUIRES_PAYMENT",
        amountCents: remainderTotalCents,
        currency: "USD",
        provider: "stripe",
      },
    }));

  const connectPayoutEnabled = !!booking.provider.stripeAccountId;

  const applicationFeeCents = cents(
    booking.platformFeeCents + booking.affiliateCommissionCents -
      // subtract any platform fee already taken on the deposit (approx proportional)
      (booking.platformFeeCents + booking.affiliateCommissionCents) * 0.25
  );

  const params: any = {
    amount: remainderTotalCents,
    currency: "usd",
    customer: booking.stripeCustomerId,
    payment_method: booking.stripePaymentMethodId,
    off_session: true,
    confirm: true,
    description: `Beauty Meet remainder for booking ${booking.id}`,
    metadata: { bookingId: booking.id, kind: "remainder" },
  };

  if (connectPayoutEnabled) {
    params.application_fee_amount = applicationFeeCents;
    params.transfer_data = { destination: booking.provider.stripeAccountId };
  }

  const pi = await stripe.paymentIntents.create(params, {
    idempotencyKey: `bm_${booking.id}_remainder_v1`,
  });

  await prisma.payment.update({
    where: { id: remainderPayment.id },
    data: {
      status: pi.status === "succeeded" ? "CAPTURED" : "AUTHORIZED",
      paymentIntentId: pi.id,
      latestChargeId: (pi.latest_charge as string) || null,
    },
  });

  if (pi.status === "succeeded") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
}
