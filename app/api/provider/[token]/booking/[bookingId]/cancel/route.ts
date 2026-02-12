import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelBookingByTechFullRefund, markNoShowByTech } from "@/lib/cancel";

export const runtime = "nodejs";

// Tech cancel requires a reason:
// - reason=TECH (tech too busy/can't do it) => full refund (release auth)
// - reason=NO_SHOW (customer no-show) => capture 20% deposit
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

  const form = await req.formData().catch(() => null);
  const reason = (form?.get("reason") as string | null) || "TECH";

  if (reason === "NO_SHOW") {
    // Only valid at/after appointment time; captures deposit only.
    await markNoShowByTech(booking.id).catch(() => null);
  } else {
    // Tech fault => full refund (release authorization).
    await cancelBookingByTechFullRefund(booking.id);
  }

  return NextResponse.redirect(new URL(`/tech/${token}`, req.url));
}
