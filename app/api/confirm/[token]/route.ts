import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeRemainderForBooking } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const booking = await prisma.booking.findFirst({ where: { customerConfirmToken: token } });
  if (!booking) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { customerConfirmedAt: new Date() },
  });

  const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
  if (updated?.providerConfirmedAt && !updated.completedAt && !updated.issueReportedAt) {
    await chargeRemainderForBooking(updated.id).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
