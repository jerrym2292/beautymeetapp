import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";
import { chargeRemainderForBooking } from "@/lib/payments";

export const runtime = "nodejs";

// Sweep endpoint to auto-charge remaining balances after the 12h window.
// Recommended: call every 5-15 minutes via server cron.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const now = new Date();

  const due = await prisma.booking.findMany({
    where: {
      completedAt: null,
      issueReportedAt: null,
      providerConfirmedAt: { not: null },
      autoChargeAt: { not: null, lte: now },
    },
    select: { id: true },
    take: 25,
    orderBy: { autoChargeAt: "asc" },
  });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const b of due) {
    try {
      await chargeRemainderForBooking(b.id);
      results.push({ id: b.id, ok: true });
    } catch (e: any) {
      results.push({ id: b.id, ok: false, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}
