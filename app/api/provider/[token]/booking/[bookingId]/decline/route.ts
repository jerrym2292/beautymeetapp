import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelBookingByTechFullRefund } from "@/lib/cancel";

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
  });
  if (!booking) return NextResponse.redirect(new URL(`/tech/${token}`, req.url));

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "DECLINED" } });

  // Deposit-only: refund deposit in full.
  await cancelBookingByTechFullRefund(booking.id).catch(() => null);

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
