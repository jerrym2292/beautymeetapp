import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { requestTechReviewBySMS } from "@/lib/reviews";
import { sendPaymentReceiptSMS } from "@/lib/receipts";

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
      customer: true,
      payments: true,
    },
  });
  if (!booking) throw new Error("Booking not found");
  const b = booking; // help TS narrow
  if (b.completedAt) return;
  if (b.issueReportedAt) throw new Error("Issue reported; remainder charge paused");

  const depositPayment = b.payments.find((p) => p.type === "DEPOSIT");
  if (!depositPayment || depositPayment.status !== "CAPTURED") {
    throw new Error("Deposit not captured");
  }

  const subtotalCents = b.servicePriceCents + b.travelFeeCents;

  // Deposit base is (deposit - its processing fee). We recompute remaining from policy:
  // remainder base = subtotal - depositBase
  // Since b.depositCents includes processing fee, estimate deposit base = deposit / 1.03.
  const depositBaseApprox = cents(b.depositCents / 1.03);
  const remainingBaseCents = Math.max(0, subtotalCents - depositBaseApprox);
  const remainderStripeFeeCents = cents(remainingBaseCents * 0.03);
  const remainderTotalCents = remainingBaseCents + remainderStripeFeeCents;

  // Already charged?
  const existingRemainder = b.payments.find((p) => p.type === "REMAINDER");
  async function markCompletedAndMaybeReward(ts: Date) {
    // Mark completed + reward referral
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: b.id },
        data: { status: "COMPLETED", completedAt: ts },
      });

      const c = b.customer;
      if (c?.referredByCustomerId && !c.referralRewardGranted) {
        const completedCount = await tx.booking.count({
          where: { customerId: c.id, status: "COMPLETED" },
        });
        if (completedCount === 1) {
          await tx.customer.update({
            where: { id: c.id },
            data: { referralRewardGranted: true },
          });
          await tx.customer.updateMany({
            where: { id: c.referredByCustomerId, nextBookingDiscountPct: 0 },
            data: { nextBookingDiscountPct: 10 },
          });
        }
      }
    });

    // Review request (once)
    const claimed = await prisma.booking.updateMany({
      where: { id: b.id, reviewRequestedAt: null },
      data: { reviewRequestedAt: new Date() },
    });

    if (claimed.count > 0) {
      await requestTechReviewBySMS({
        to: b.customer.phone,
        providerName: b.provider.displayName,
        providerId: b.providerId,
        bookingId: b.id,
        baseUrl: process.env.APP_BASE_URL,
      }).catch(() => null);
    }
  }

  if (existingRemainder && existingRemainder.status === "CAPTURED") {
    // Mark completed (safety)
    await markCompletedAndMaybeReward(b.completedAt ?? new Date());
    return;
  }

  if (remainderTotalCents <= 0) {
    await markCompletedAndMaybeReward(new Date());
    return;
  }

  if (!b.stripeCustomerId || !b.stripePaymentMethodId) {
    throw new Error("Missing saved payment method");
  }

  const stripe = getStripe();

  // Create/ensure remainder Payment record
  const remainderPayment =
    existingRemainder ||
    (await prisma.payment.create({
      data: {
        bookingId: b.id,
        type: "REMAINDER",
        status: "REQUIRES_PAYMENT",
        amountCents: remainderTotalCents,
        currency: "USD",
        provider: "stripe",
      },
    }));

  const connectPayoutEnabled = !!b.provider.stripeAccountId;

  const applicationFeeCents = cents(
    b.platformFeeCents + b.affiliateCommissionCents -
      // subtract any platform fee already taken on the deposit (approx proportional)
      (b.platformFeeCents + b.affiliateCommissionCents) * 0.25
  );

  const params: any = {
    amount: remainderTotalCents,
    currency: "usd",
    customer: b.stripeCustomerId,
    payment_method: b.stripePaymentMethodId,
    off_session: true,
    confirm: true,
    description: `Beauty Meet remainder for booking ${b.id}`,
    metadata: { bookingId: b.id, kind: "remainder" },
  };

  if (connectPayoutEnabled) {
    params.application_fee_amount = applicationFeeCents;
    params.transfer_data = { destination: b.provider.stripeAccountId };
  }

  const pi = await stripe.paymentIntents.create(params, {
    idempotencyKey: `bm_${b.id}_remainder_v1`,
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
    // Send receipt SMS once
    const claimed = await prisma.payment.updateMany({
      where: { id: remainderPayment.id, receiptSmsSentAt: null },
      data: { receiptSmsSentAt: new Date() },
    });
    if (claimed.count > 0) {
      await sendPaymentReceiptSMS({
        to: b.customer.phone,
        amountCents: remainderTotalCents,
        kind: "Remainder",
        bookingId: b.id,
        providerName: b.provider.displayName,
      }).catch(() => null);
    }

    await markCompletedAndMaybeReward(new Date());
  }
}
