import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export function hoursUntil(startAt: Date, now = new Date()) {
  return (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export async function cancelBookingCustomer(bookingId: string, mode: "EARLY" | "LATE") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  const stripe = getStripe();
  const pi = booking.payment?.paymentIntentId;

  if (pi) {
    if (mode === "EARLY") {
      // Release full authorization.
      await stripe.paymentIntents.cancel(pi).catch(() => null);
      await prisma.payment.update({ where: { id: booking.payment!.id }, data: { status: "VOIDED" } });
    } else {
      // Capture only the deposit; rest is released.
      await stripe.paymentIntents.capture(pi, { amount_to_capture: booking.depositCents }).catch(() => null);
      await prisma.payment.update({ where: { id: booking.payment!.id }, data: { status: "CAPTURED" } });
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
}

export async function cancelBookingByTechFullRefund(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  const stripe = getStripe();
  const pi = booking.payment?.paymentIntentId;
  if (pi) {
    // Tech cancellation is not the customer’s fault → full refund: release authorization.
    await stripe.paymentIntents.cancel(pi).catch(() => null);
    await prisma.payment.update({ where: { id: booking.payment!.id }, data: { status: "VOIDED" } });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
}

export async function markNoShowByTech(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.status === "NO_SHOW" || booking.status === "CANCELLED" || booking.status === "DECLINED") return;
  if (booking.completedAt) throw new Error("Already completed");

  // Only allow no-show at/after appointment time.
  if (new Date().getTime() < booking.startAt.getTime()) {
    throw new Error("Too early to mark no-show");
  }

  const stripe = getStripe();
  const pi = booking.payment?.paymentIntentId;
  if (pi) {
    await stripe.paymentIntents.capture(pi, { amount_to_capture: booking.depositCents }).catch(() => null);
    await prisma.payment.update({ where: { id: booking.payment!.id }, data: { status: "CAPTURED" } });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "NO_SHOW" },
  });
}
