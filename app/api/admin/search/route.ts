import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ ok: true, providers: [], customers: [], bookings: [] });
  }

  const isLikelyId = q.length >= 10;

  const [providers, customers, bookings] = await Promise.all([
    prisma.provider.findMany({
      where: {
        OR: [
          { displayName: { contains: q } },
          ...(isLikelyId ? [{ id: q }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, displayName: true, active: true, createdAt: true },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
          ...(isLikelyId ? [{ id: q }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, fullName: true, phone: true, email: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          ...(isLikelyId ? [{ id: q }] : []),
          { customer: { fullName: { contains: q } } },
          { customer: { phone: { contains: q } } },
          { provider: { displayName: { contains: q } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        createdAt: true,
        startAt: true,
        totalCents: true,
        customer: { select: { fullName: true, phone: true } },
        provider: { select: { displayName: true } },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, providers, customers, bookings });
}
