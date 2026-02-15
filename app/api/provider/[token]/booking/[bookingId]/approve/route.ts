import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string; bookingId: string }> }
) {
  const { token, bookingId } = await params;
  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) return NextResponse.redirect(new URL(`/`, req.url));

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, providerId: provider.id },
    include: { payment: true },
  });
  if (!booking) return NextResponse.redirect(new URL(`/tech/${token}`, req.url));

  // If it's already approved/declined/cancelled/etc, don't double-charge.
  if (booking.status !== "PENDING") {
    return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
  }

  // Auto-expire after 2 hours.
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  if (Date.now() - booking.createdAt.getTime() > TWO_HOURS_MS) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } });
    return NextResponse.redirect(new URL(`/tech/${token}?err=expired`, req.url));
  }

  // Must have card on file to auto-charge.
  if (!booking.payment?.stripeCustomerId || !booking.payment?.stripePaymentMethodId) {
    // Leave status as PENDING; tech can retry later.
    // TODO: SMS customer: "Please add a card to complete your request"
    return NextResponse.redirect(new URL(`/tech/${token}?err=missing_card`, req.url));
  }

  const stripe = getStripe();

  // Charge the full amount now (platform charge). We'll transfer to the tech only after completion.
  const pi = await stripe.paymentIntents.create({
    amount: booking.totalCents,
    currency: "usd",
    customer: booking.payment.stripeCustomerId,
    payment_method: booking.payment.stripePaymentMethodId,
    confirm: true,
    off_session: true,
    metadata: {
      bookingId: booking.id,
      providerId: booking.providerId,
    },
  });

  await prisma.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: "CAPTURED",
      paymentIntentId: pi.id,
      latestChargeId: (pi.latest_charge as string) || null,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "APPROVED" },
  });

  // TODO: SMS customer: approved + appointment details

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
