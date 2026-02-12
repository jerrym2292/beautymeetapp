import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelBookingCustomer, hoursUntil } from "@/lib/cancel";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const booking = await prisma.booking.findFirst({ where: { customerCancelToken: token } });
  if (!booking) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const hrs = hoursUntil(booking.startAt);
  const mode = hrs >= 3 ? "EARLY" : "LATE";
  await cancelBookingCustomer(booking.id, mode);

  return NextResponse.json({ ok: true, mode });
}
