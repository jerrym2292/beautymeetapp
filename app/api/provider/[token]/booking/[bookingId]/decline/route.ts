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

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "DECLINED" } });

  if (booking.payment?.paymentIntentId) {
    const stripe = getStripe();
    await stripe.paymentIntents.cancel(booking.payment.paymentIntentId).catch(() => null);
    await prisma.payment.update({ where: { id: booking.payment.id }, data: { status: "VOIDED" } });
  }

  // TODO: SMS to customer

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
