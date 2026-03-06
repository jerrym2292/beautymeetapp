import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  DEFAULT_SETTINGS,
  DEFAULT_WINDOWS,
  computeAvailableSlots,
  type AvailabilitySettings,
  type WeeklyWindows,
  type TimeOffRange,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

const BusyQ = z.object({
  date: z.string().min(10).max(10), // YYYY-MM-DD
});

// Customer-facing availability endpoint.
// - If `?date=YYYY-MM-DD` is provided, returns busy intervals for that day (back-compat).
// - Otherwise returns computed availableSlots based on provider windows/settings/timeOff.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const url = new URL(req.url);

  const date = url.searchParams.get("date");
  if (date) {
    const parsed = BusyQ.safeParse({ date });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

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

  const fromISO = url.searchParams.get("from") ?? new Date().toISOString();
  const toISO =
    url.searchParams.get("to") ??
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const serviceId = url.searchParams.get("serviceId");
  const durationMinParam = url.searchParams.get("durationMin");

  let durationMin = durationMinParam ? Number(durationMinParam) : 60;
  if (!Number.isFinite(durationMin) || durationMin <= 0) durationMin = 60;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      active: true,
      subscriptionActive: true,
      availabilitySettingsJson: true,
      availabilityWindowsJson: true,
      availabilityTimeOffJson: true,
    },
  });

  if (!provider || !provider.active || !provider.subscriptionActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (serviceId) {
    const svc = await prisma.service.findFirst({
      where: { id: serviceId, providerId, active: true },
      select: { durationMin: true },
    });
    if (svc?.durationMin) durationMin = svc.durationMin;
  }

  const settings = safeJsonParse<AvailabilitySettings>(
    provider.availabilitySettingsJson,
    DEFAULT_SETTINGS
  );
  const windows = safeJsonParse<WeeklyWindows>(
    provider.availabilityWindowsJson,
    DEFAULT_WINDOWS
  );
  const timeOff = safeJsonParse<TimeOffRange[]>(
    provider.availabilityTimeOffJson,
    []
  );

  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      startAt: {
        gte: new Date(new Date(fromISO).getTime() - 1000 * 60 * 60 * 24),
        lte: new Date(new Date(toISO).getTime() + 1000 * 60 * 60 * 24),
      },
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { startAt: true, service: { select: { durationMin: true } } },
  });

  const existingBookings = bookings.map((b) => {
    const startAt = b.startAt;
    const endAt = new Date(startAt.getTime() + b.service.durationMin * 60 * 1000);
    return { startAt, endAt };
  });

  let availableSlots: string[] = [];
  try {
    availableSlots = computeAvailableSlots({
      fromISO,
      toISO,
      settings,
      windows,
      timeOff,
      existingBookings,
      durationMin,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to compute" },
      { status: 400 }
    );
  }

  return NextResponse.json({ providerId, settings, durationMin, availableSlots });
}
