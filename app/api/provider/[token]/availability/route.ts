import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SETTINGS,
  DEFAULT_WINDOWS,
  validateWeeklyWindows,
  validateTimeOff,
  type AvailabilitySettings,
  type WeeklyWindows,
  type TimeOffRange,
} from "@/lib/availability";
import { z } from "zod";

export const dynamic = "force-dynamic";

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

const PutBodySchema = z.object({
  settings: z
    .object({
      timezone: z.string().min(1),
      slotIntervalMin: z.number().int().min(5).max(120),
      leadTimeMin: z.number().int().min(0).max(60 * 24 * 14),
      bufferMin: z.number().int().min(0).max(240),
    })
    .strict(),
  windows: z.record(z.string(), z.array(z.object({ start: z.string(), end: z.string() }))),
  timeOff: z.array(z.object({ startISO: z.string(), endISO: z.string() })),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    select: {
      id: true,
      displayName: true,
      availabilitySettingsJson: true,
      availabilityWindowsJson: true,
      availabilityTimeOffJson: true,
    },
  });

  if (!provider) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
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

  return NextResponse.json({
    provider: { id: provider.id, displayName: provider.displayName },
    settings,
    windows,
    timeOff,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });

  if (!provider) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PutBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { settings, windows, timeOff } = parsed.data;

  try {
    validateWeeklyWindows(windows);
    validateTimeOff(timeOff);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Validation failed" }, { status: 400 });
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      availabilitySettingsJson: JSON.stringify(settings),
      availabilityWindowsJson: JSON.stringify(windows),
      availabilityTimeOffJson: JSON.stringify(timeOff),
    },
  });

  return NextResponse.json({ ok: true });
}
