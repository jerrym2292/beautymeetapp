import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export function hoursUntil(startAt: Date, now = new Date()) {
  return (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
}

async function refundPaymentIntent(paymentIntentId: string, amountCents?: number) {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(typeof amountCents === "number" ? { amount: amountCents } : {}),
  });
}

/**
 * Customer cancel rules under new flow:
 * - Before approval/charge: just cancel request (no money taken)
 * - After approval/charge:
 *   - EARLY => full refund
 *   - LATE  => keep 20% deposit, refund the rest
 */
export async function cancelBookingCustomer(bookingId: string, mode: "EARLY" | "LATE") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED" || booking.status === "EXPIRED") return;
  if (booking.completedAt) throw new Error("Already completed");

  const payment = booking.payment;
  const pi = payment?.paymentIntentId;

  if (pi && payment?.status === "CAPTURED") {
    if (mode === "EARLY") {
      const refund = await refundPaymentIntent(pi);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", latestRefundId: refund.id },
      });
    } else {
      const refundAmount = Math.max(0, booking.totalCents - booking.depositCents);
      const refund = await refundPaymentIntent(pi, refundAmount);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", latestRefundId: refund.id },
      });
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
}

/**
 * Tech cancel => FULL refund if customer was charged.
 */
export async function cancelBookingByTechFullRefund(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED" || booking.status === "EXPIRED") return;
  if (booking.completedAt) throw new Error("Already completed");

  const payment = booking.payment;
  const pi = payment?.paymentIntentId;

  if (pi && payment?.status === "CAPTURED") {
    const refund = await refundPaymentIntent(pi);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED", latestRefundId: refund.id },
    });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
}

/**
 * No-show => keep 20% deposit, refund remaining 80% (only if payment was captured).
 */
export async function markNoShowByTech(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "NO_SHOW" || booking.status === "CANCELLED" || booking.status === "DECLINED" || booking.status === "EXPIRED") return;
  if (booking.completedAt) throw new Error("Already completed");

  // Only allow no-show at/after appointment time.
  if (new Date().getTime() < booking.startAt.getTime()) {
    throw new Error("Too early to mark no-show");
  }

  const payment = booking.payment;
  const pi = payment?.paymentIntentId;

  if (pi && payment?.status === "CAPTURED") {
    const refundAmount = Math.max(0, booking.totalCents - booking.depositCents);
    const refund = await refundPaymentIntent(pi, refundAmount);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED", latestRefundId: refund.id },
    });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "NO_SHOW" },
  });
}
