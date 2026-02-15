import { prisma } from "@/lib/prisma";
import { releaseFundsAndCompleteBooking } from "@/lib/payouts";

/**
 * Legacy name kept for minimal refactors.
 * Under the new flow:
 * - Customer is charged in full when the tech approves.
 * - When BOTH parties confirm completion, we release funds to the tech (minus platform fee).
 */
export async function captureFullPaymentForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  await releaseFundsAndCompleteBooking(bookingId);
}

