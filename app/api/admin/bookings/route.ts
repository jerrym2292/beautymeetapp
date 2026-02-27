import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));

  const where: any = {};
  if (status) where.status = status;

  if (q) {
    const isLikelyId = q.length >= 10;
    where.OR = [
      ...(isLikelyId ? [{ id: q }] : []),
      { customer: { fullName: { contains: q } } },
      { customer: { phone: { contains: q } } },
      { provider: { displayName: { contains: q } } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      status: true,
      startAt: true,
      isMobile: true,
      totalCents: true,
      depositCents: true,
      issueReportedAt: true,
      providerConfirmedAt: true,
      customerConfirmedAt: true,
      completedAt: true,
      provider: { select: { id: true, displayName: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
      service: { select: { id: true, name: true } },
      payments: {
        select: { id: true, type: true, status: true, amountCents: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ ok: true, bookings });
}
