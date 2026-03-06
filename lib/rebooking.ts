import { prisma } from "./prisma";
import { sendSMS } from "./sms";

/**
 * Run this daily via cron to send re-booking reminders.
 */
export async function processRebookingReminders() {
  const providers = await prisma.provider.findMany({
    where: { rebookingSmsEnabled: true },
    include: { services: true }
  });

  const now = new Date();
  let count = 0;

  for (const provider of providers) {
    for (const service of provider.services) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - (service.rebookingWeeks * 7));
      
      // Look for clients whose last completed booking for this service was exactly X weeks ago
      const bookings = await prisma.booking.findMany({
        where: {
          serviceId: service.id,
          status: "COMPLETED",
          completedAt: {
            gte: new Date(targetDate.setHours(0,0,0,0)),
            lte: new Date(targetDate.setHours(23,59,59,999)),
          }
        },
        include: { customer: true }
      });

      for (const booking of bookings) {
        // Check if they already have a future booking scheduled to avoid annoying them
        const futureBooking = await prisma.booking.findFirst({
          where: {
            customerId: booking.customerId,
            serviceId: service.id,
            startAt: { gte: now },
            status: { in: ["PENDING", "APPROVED"] }
          }
        });

        if (!futureBooking) {
          const message = `Hi ${booking.customer.fullName}! It's been ${service.rebookingWeeks} weeks since your last ${service.name} with ${provider.displayName}. Time for a refresh? Book here: ${process.env.APP_BASE_URL}/p/${provider.id}`;
          await sendSMS(booking.customer.phone, message);
          count++;
        }
      }
    }
  }

  return count;
}
