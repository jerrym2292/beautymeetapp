import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const Q = z.object({
  date: z.string().min(10).max(10), // YYYY-MM-DD
});

// Returns busy intervals for a provider for a given date.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const url = new URL(req.url);
  const parsed = Q.safeParse({ date: url.searchParams.get("date") || "" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const provider = await prisma.provider.findUnique({
    where: { id: providerId, active: true, subscriptionActive: true },
    select: { id: true },
  });
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dayStart = new Date(`${parsed.data.date}T00:00:00`);
  const dayEnd = new Date(`${parsed.data.date}T23:59:59`);

  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      startAt: { gte: dayStart, lte: dayEnd },
      // Block out any appointment that isn't explicitly cancelled/declined
      status: { notIn: ["CANCELLED", "DECLINED"] },
    },
    include: { service: { select: { durationMin: true } } },
    orderBy: { startAt: "asc" },
  });

  const busy = bookings.map((b) => {
    const start = b.startAt;
    const end = new Date(start.getTime() + b.service.durationMin * 60 * 1000);
    return {
      bookingId: b.id,
      status: b.status,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  });

  return NextResponse.json({ ok: true, busy });
}
