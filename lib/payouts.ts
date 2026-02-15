import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Release funds to the provider AFTER service completion.
 * - Platform keeps platformFeeCents (5% of service price)
 * - Provider receives (totalCents - platformFeeCents)
 */
export async function releaseFundsAndCompleteBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, provider: true },
  });
  if (!booking) throw new Error("Booking not found");

  if (booking.completedAt) return; // idempotent
  if (booking.status !== "APPROVED") throw new Error("Booking not approved");

  const payment = booking.payment;
  if (!payment || payment.status !== "CAPTURED") {
    throw new Error("Payment not captured");
  }

  const provider = booking.provider;
  if (!provider.stripeAccountId) throw new Error("Provider not connected to Stripe");

  const payoutCents = Math.max(0, booking.totalCents - booking.platformFeeCents);

  const stripe = getStripe();
  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: "usd",
    destination: provider.stripeAccountId,
    metadata: {
      bookingId: booking.id,
      providerId: provider.id,
      paymentId: payment.id,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { latestTransferId: transfer.id },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}
