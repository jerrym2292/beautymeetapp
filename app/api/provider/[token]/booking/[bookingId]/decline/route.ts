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

  // Under the new flow, we should not have charged yet while PENDING.
  // If we somehow have a captured charge, refund it.
  if (booking.payment?.paymentIntentId && booking.payment.status === "CAPTURED") {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({ payment_intent: booking.payment.paymentIntentId });
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { status: "REFUNDED", latestRefundId: refund.id },
    });
  }

  // TODO: email notification to customer

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
