import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeRemainderForBooking } from "@/lib/payments";

export const runtime = "nodejs";

const AUTO_CONFIRM_HOURS = 12;

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

  const now = new Date();
  const autoChargeAt = new Date(now.getTime() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000);

  await prisma.booking.update({
    where: { id: booking.id },
    data: { providerConfirmedAt: now, autoChargeAt },
  });

  const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
  if (updated?.customerConfirmedAt && !updated.completedAt && !updated.issueReportedAt) {
    await chargeRemainderForBooking(updated.id).catch(() => null);
  }

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
