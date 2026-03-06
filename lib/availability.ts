import { DateTime, Interval } from "luxon";

export type AvailabilitySettings = {
  timezone: string; // IANA tz (e.g. "America/New_York")
  slotIntervalMin: number;
  leadTimeMin: number;
  bufferMin: number;
};

export type TimeWindow = { start: string; end: string }; // HH:mm
export type WeeklyWindows = Record<string, TimeWindow[]>; // keys: "0".."6" (Luxon weekday: Mon=1..Sun=7; we will map from JS getDay)

export type TimeOffRange = { startISO: string; endISO: string };

export const DEFAULT_SETTINGS: AvailabilitySettings = {
  timezone: "America/New_York",
  slotIntervalMin: 15,
  leadTimeMin: 120,
  bufferMin: 10,
};

export const DEFAULT_WINDOWS: WeeklyWindows = {
  // JS day: 0=Sun..6=Sat
  "0": [],
  "1": [{ start: "09:00", end: "17:00" }],
  "2": [{ start: "09:00", end: "17:00" }],
  "3": [{ start: "09:00", end: "17:00" }],
  "4": [{ start: "09:00", end: "17:00" }],
  "5": [{ start: "09:00", end: "17:00" }],
  "6": [],
};

function parseHHmm(hhmm: string): { h: number; m: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

export function validateWeeklyWindows(windows: WeeklyWindows) {
  for (const dayKey of Object.keys(windows)) {
    const list = windows[dayKey] ?? [];
    // validate and normalize
    const intervals: Array<{ startMin: number; endMin: number }> = [];
    for (const w of list) {
      const s = parseHHmm(w.start);
      const e = parseHHmm(w.end);
      if (!s || !e) throw new Error(`Invalid time format for day ${dayKey}. Use HH:mm.`);
      const startMin = s.h * 60 + s.m;
      const endMin = e.h * 60 + e.m;
      if (endMin <= startMin) throw new Error(`Window end must be after start for day ${dayKey}.`);
      intervals.push({ startMin, endMin });
    }
    intervals.sort((a, b) => a.startMin - b.startMin);
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].startMin < intervals[i - 1].endMin) {
        throw new Error(`Overlapping windows on day ${dayKey}.`);
      }
    }
  }
}

export function validateTimeOff(ranges: TimeOffRange[]) {
  for (const r of ranges) {
    const s = DateTime.fromISO(r.startISO);
    const e = DateTime.fromISO(r.endISO);
    if (!s.isValid || !e.isValid) throw new Error("Invalid time-off ISO datetimes.");
    if (e <= s) throw new Error("Time-off end must be after start.");
  }
}

export function computeAvailableSlots(args: {
  fromISO: string;
  toISO: string;
  settings: AvailabilitySettings;
  windows: WeeklyWindows;
  timeOff: TimeOffRange[];
  existingBookings: Array<{ startAt: Date; endAt: Date }>;
  durationMin: number;
}): string[] {
  const { fromISO, toISO, settings, windows, timeOff, existingBookings, durationMin } = args;

  const tz = settings.timezone;
  const from = DateTime.fromISO(fromISO, { zone: tz });
  const to = DateTime.fromISO(toISO, { zone: tz });
  if (!from.isValid || !to.isValid) throw new Error("Invalid from/to.");
  if (to <= from) return [];

  const now = DateTime.now().setZone(tz);
  const minStart = now.plus({ minutes: settings.leadTimeMin });

  const slotInterval = Math.max(5, Math.floor(settings.slotIntervalMin));
  const bufferMin = Math.max(0, Math.floor(settings.bufferMin));

  // Build busy intervals (bookings + buffer)
  const busy: Interval[] = [];
  for (const b of existingBookings) {
    const s = DateTime.fromJSDate(b.startAt, { zone: tz }).minus({ minutes: bufferMin });
    const e = DateTime.fromJSDate(b.endAt, { zone: tz }).plus({ minutes: bufferMin });
    if (s.isValid && e.isValid && e > s) busy.push(Interval.fromDateTimes(s, e));
  }
  for (const off of timeOff) {
    const s = DateTime.fromISO(off.startISO, { zone: tz });
    const e = DateTime.fromISO(off.endISO, { zone: tz });
    if (s.isValid && e.isValid && e > s) busy.push(Interval.fromDateTimes(s, e));
  }

  const slots: string[] = [];

  // Iterate days in range
  let cursorDay = from.startOf("day");
  const endDay = to.startOf("day");

  while (cursorDay <= endDay) {
    const dayKey = String(cursorDay.toJSDate().getDay()); // 0..6
    const dayWindows = windows[dayKey] ?? [];

    for (const w of dayWindows) {
      const sParts = parseHHmm(w.start);
      const eParts = parseHHmm(w.end);
      if (!sParts || !eParts) continue;

      const winStart = cursorDay.set({ hour: sParts.h, minute: sParts.m, second: 0, millisecond: 0 });
      const winEnd = cursorDay.set({ hour: eParts.h, minute: eParts.m, second: 0, millisecond: 0 });
      if (winEnd <= winStart) continue;

      // Slot start times within this window
      let t = winStart;
      // Align to interval
      const remainder = (t.minute + t.hour * 60) % slotInterval;
      if (remainder !== 0) t = t.plus({ minutes: slotInterval - remainder });

      while (t.plus({ minutes: durationMin }) <= winEnd) {
        if (t >= from && t.plus({ minutes: durationMin }) <= to && t >= minStart) {
          const slotIntervalObj = Interval.fromDateTimes(t, t.plus({ minutes: durationMin }));
          const overlaps = busy.some((bi) => bi.overlaps(slotIntervalObj));
          if (!overlaps) {
            slots.push(t.toUTC().toISO()!);
          }
        }
        t = t.plus({ minutes: slotInterval });
      }
    }

    cursorDay = cursorDay.plus({ days: 1 });
  }

  return slots;
}
