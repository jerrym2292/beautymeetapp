import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markNoShowByTech } from "@/lib/cancel";

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

  // Only tech can mark no-show; captures deposit only.
  try {
    await markNoShowByTech(booking.id);
  } catch {
    // ignore for MVP (could show UI error later)
  }

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
