import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export function hoursUntil(startAt: Date, now = new Date()) {
  return (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
}

async function refundPaymentIntent(pi: string) {
  const stripe = getStripe();
  // Full refund of the latest charge.
  await stripe.refunds.create({ payment_intent: pi }).catch(() => null);
}

export async function cancelBookingCustomer(bookingId: string, mode: "EARLY" | "LATE") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  // Deposit-only policy:
  // - EARLY: refund deposit (full)
  // - LATE: keep deposit
  if (mode === "EARLY") {
    const deposit = booking.payments.find((p) => p.type === "DEPOSIT");
    if (deposit?.paymentIntentId) {
      await refundPaymentIntent(deposit.paymentIntentId);
      await prisma.payment.update({ where: { id: deposit.id }, data: { status: "REFUNDED" } });
    }
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
}

export async function cancelBookingByTechFullRefund(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  const deposit = booking.payments.find((p) => p.type === "DEPOSIT");
  if (deposit?.paymentIntentId) {
    await refundPaymentIntent(deposit.paymentIntentId);
    await prisma.payment.update({ where: { id: deposit.id }, data: { status: "REFUNDED" } });
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
}

export async function markNoShowByTech(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "NO_SHOW" || booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  // Only allow no-show at/after appointment time.
  if (new Date().getTime() < booking.startAt.getTime()) {
    throw new Error("Too early to mark no-show");
  }

  // Deposit-only: keep deposit. No action required.
  await prisma.booking.update({ where: { id: booking.id }, data: { status: "NO_SHOW" } });
}
