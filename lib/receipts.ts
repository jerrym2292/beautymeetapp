import { sendSMS } from "@/lib/sms";

export async function sendPaymentReceiptSMS(opts: {
  to: string;
  amountCents: number;
  kind: string;
  bookingId: string;
  providerName?: string;
}) {
  const { to, amountCents, kind, bookingId, providerName } = opts;

  const amount = `$${(amountCents / 100).toFixed(2)}`;
  const who = providerName ? ` with ${providerName}` : "";

  const body = `Beauty Meet receipt: ${kind} payment ${amount}${who}. Booking ${bookingId}.`;
  await sendSMS(to, body);
}
