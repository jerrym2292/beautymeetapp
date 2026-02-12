import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureFullPaymentForBooking } from "@/lib/payments";

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
  if (updated?.providerConfirmedAt && !updated.completedAt) {
    await captureFullPaymentForBooking(updated.id);
  }

  return NextResponse.json({ ok: true });
}
