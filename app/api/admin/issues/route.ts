import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const issues = await prisma.booking.findMany({
    where: { issueReportedAt: { not: null }, completedAt: null },
    orderBy: { issueReportedAt: "desc" },
    take: 200,
    include: {
      provider: { select: { id: true, displayName: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
      service: { select: { id: true, name: true } },
      payments: { select: { id: true, type: true, status: true, amountCents: true } },
    },
  });

  return NextResponse.json({ ok: true, issues });
}
