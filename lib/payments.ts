import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function captureFullPaymentForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking || !booking.payment?.paymentIntentId) {
    throw new Error("Missing payment intent");
  }

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.capture(booking.payment.paymentIntentId);

  await prisma.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: "CAPTURED",
      latestChargeId: (pi.latest_charge as string) || null,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}
