import { prisma } from "@/lib/prisma";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function expireStaleBookingRequests(now = new Date()) {
  const cutoff = new Date(now.getTime() - TWO_HOURS_MS);

  // Expire bookings that have been pending too long.
  // IMPORTANT: This assumes we have not charged the customer yet.
  // If/when we introduce saved-card flows, ensure any reserved/auth holds are released here.
  await prisma.booking.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
      completedAt: null,
    },
    data: {
      status: "EXPIRED",
    },
  });
}
