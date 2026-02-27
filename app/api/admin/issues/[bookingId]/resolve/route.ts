import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../../_auth";
import { chargeRemainderForBooking } from "@/lib/payments";

export const runtime = "nodejs";

// Resolve an issue:
// - clears issueReportedAt
// - optionally attempts to charge remainder immediately (if eligible)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { bookingId } = await params;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { issueReportedAt: null },
  });

  // Best-effort: try charging remainder now. If it fails, admin can retry later.
  let charged = false;
  let chargeError: string | null = null;
  try {
    await chargeRemainderForBooking(bookingId);
    charged = true;
  } catch (e: any) {
    chargeError = String(e?.message || e);
  }

  return NextResponse.json({ ok: true, resolved: true, charged, chargeError });
}
