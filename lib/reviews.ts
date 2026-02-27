import { sendSMS } from "@/lib/sms";

export async function requestTechReviewBySMS(opts: {
  to: string;
  providerName: string;
  providerId: string;
  bookingId: string;
  baseUrl?: string;
}) {
  const { to, providerName, providerId, bookingId, baseUrl } = opts;

  const url = baseUrl ? `${baseUrl.replace(/\/$/, "")}/p/${providerId}` : null;

  // Keep it simple for MVP: ask for a rating + optional comment.
  const msg = url
    ? `Beauty Meet: How was your appointment with ${providerName}? Reply with 1-5 stars and any notes. Booking ${bookingId}. ${url}`
    : `Beauty Meet: How was your appointment with ${providerName}? Reply with 1-5 stars and any notes. Booking ${bookingId}.`;

  await sendSMS(to, msg);
}
