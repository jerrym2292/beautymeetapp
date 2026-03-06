"use client";

import React, { useEffect, useMemo, useState } from "react";

type Settings = {
  timezone: string;
  slotIntervalMin: number;
  leadTimeMin: number;
  bufferMin: number;
};

type Window = { start: string; end: string };

type WeeklyWindows = Record<string, Window[]>; // 0..6

type TimeOffRange = { startISO: string; endISO: string };

const dayNames: Record<string, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
};

function toLocalInputValue(iso: string) {
  // datetime-local wants "YYYY-MM-DDTHH:mm"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(val: string) {
  // Treat the local datetime as local machine time; store ISO.
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function AvailabilityEditor({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [providerId, setProviderId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>({
    timezone: "America/New_York",
    slotIntervalMin: 15,
    leadTimeMin: 120,
    bufferMin: 10,
  });
  const [windows, setWindows] = useState<WeeklyWindows>({
    "0": [],
    "1": [{ start: "09:00", end: "17:00" }],
    "2": [{ start: "09:00", end: "17:00" }],
    "3": [{ start: "09:00", end: "17:00" }],
    "4": [{ start: "09:00", end: "17:00" }],
    "5": [{ start: "09:00", end: "17:00" }],
    "6": [],
  });
  const [timeOff, setTimeOff] = useState<TimeOffRange[]>([]);

  const previewUrl = useMemo(() => {
    if (!providerId) return null;
    return `/api/providers/${providerId}/availability`;
  }, [providerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/provider/${token}/availability`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load");
        if (cancelled) return;
        setProviderId(json?.provider?.id ?? null);
        setDisplayName(json?.provider?.displayName ?? null);
        setSettings(json.settings);
        setWindows(json.windows);
        setTimeOff(json.timeOff ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSave() {
    setSaving(true);
    setToast(null);
    setError(null);
    try {
      const res = await fetch(`/api/provider/${token}/availability`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings, windows, timeOff }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setToast("Saved.");
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateWindow(dayKey: string, idx: number, patch: Partial<Window>) {
    setWindows((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dayKey] ?? [])];
      list[idx] = { ...list[idx], ...patch };
      copy[dayKey] = list;
      return copy;
    });
  }

  function addWindow(dayKey: string) {
    setWindows((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dayKey] ?? [])];
      list.push({ start: "09:00", end: "17:00" });
      copy[dayKey] = list;
      return copy;
    });
  }

  function removeWindow(dayKey: string, idx: number) {
    setWindows((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dayKey] ?? [])];
      list.splice(idx, 1);
      copy[dayKey] = list;
      return copy;
    });
  }

  function addTimeOff() {
    const start = new Date();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    setTimeOff((prev) => [...prev, { startISO: start.toISOString(), endISO: end.toISOString() }]);
  }

  function updateTimeOff(idx: number, patch: Partial<TimeOffRange>) {
    setTimeOff((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function removeTimeOff(idx: number) {
    setTimeOff((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }

  if (loading) {
    return <div style={card}>Loading…</div>;
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Settings</div>
            <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>
              {displayName ? `${displayName} • ` : null}
              used for slot generation
            </div>
          </div>
          <button onClick={onSave} disabled={saving} style={saving ? btnDisabled : goldBtn}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {error ? (
          <div style={{ marginTop: 12, background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.35)", padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 800, color: "#fb7185" }}>Error</div>
            <div style={{ marginTop: 4, opacity: 0.85, fontSize: 13 }}>{error}</div>
          </div>
        ) : null}

        {toast ? (
          <div style={{ marginTop: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", padding: 10, borderRadius: 12, color: "#86efac", fontWeight: 800, fontSize: 13 }}>
            {toast}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
          <Field label="Timezone (IANA)">
            <input
              value={settings.timezone}
              onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
              placeholder="America/New_York"
              style={input}
            />
          </Field>
          <Field label="Slot interval (minutes)">
            <input
              type="number"
              value={settings.slotIntervalMin}
              onChange={(e) => setSettings((s) => ({ ...s, slotIntervalMin: Number(e.target.value) }))}
              style={input}
              min={5}
              max={120}
            />
          </Field>
          <Field label="Lead time (minutes)">
            <input
              type="number"
              value={settings.leadTimeMin}
              onChange={(e) => setSettings((s) => ({ ...s, leadTimeMin: Number(e.target.value) }))}
              style={input}
              min={0}
            />
          </Field>
          <Field label="Buffer (minutes)">
            <input
              type="number"
              value={settings.bufferMin}
              onChange={(e) => setSettings((s) => ({ ...s, bufferMin: Number(e.target.value) }))}
              style={input}
              min={0}
            />
          </Field>
        </div>

        {previewUrl ? (
          <div style={{ marginTop: 14, opacity: 0.85, fontSize: 13 }}>
            Preview API: <a style={{ color: "#D4AF37" }} href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a>
          </div>
        ) : null}
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Weekly windows</div>
            <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>Multiple windows per day supported.</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {Object.keys(dayNames).map((dayKey) => (
            <div key={dayKey} style={subCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 900 }}>{dayNames[dayKey]}</div>
                <button onClick={() => addWindow(dayKey)} style={outlineBtnSmall}>
                  + Add window
                </button>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {(windows[dayKey] ?? []).map((w, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <Field label="Start (HH:mm)">
                      <input
                        value={w.start}
                        onChange={(e) => updateWindow(dayKey, idx, { start: e.target.value })}
                        style={input}
                        placeholder="09:00"
                      />
                    </Field>
                    <Field label="End (HH:mm)">
                      <input
                        value={w.end}
                        onChange={(e) => updateWindow(dayKey, idx, { end: e.target.value })}
                        style={input}
                        placeholder="17:00"
                      />
                    </Field>
                    <button onClick={() => removeWindow(dayKey, idx)} style={dangerBtnSmall}>
                      Remove
                    </button>
                  </div>
                ))}

                {(windows[dayKey] ?? []).length === 0 ? (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>No availability.</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Time off</div>
            <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>Blocks slots during these ranges.</div>
          </div>
          <button onClick={addTimeOff} style={outlineBtnSmall}>
            + Add time off
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {timeOff.map((t, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <Field label="Start">
                <input
                  type="datetime-local"
                  value={toLocalInputValue(t.startISO)}
                  onChange={(e) => updateTimeOff(idx, { startISO: fromLocalInputValue(e.target.value) })}
                  style={input}
                />
              </Field>
              <Field label="End">
                <input
                  type="datetime-local"
                  value={toLocalInputValue(t.endISO)}
                  onChange={(e) => updateTimeOff(idx, { endISO: fromLocalInputValue(e.target.value) })}
                  style={input}
                />
              </Field>
              <button onClick={() => removeTimeOff(idx)} style={dangerBtnSmall}>
                Remove
              </button>
            </div>
          ))}

          {timeOff.length === 0 ? (
            <div style={{ opacity: 0.6, fontSize: 13 }}>No time off set.</div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onSave} disabled={saving} style={saving ? btnDisabled : goldBtn}>
          {saving ? "Saving…" : "Save availability"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 18,
  backdropFilter: "blur(10px)",
};

const subCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
  outline: "none",
};

const goldBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.55)",
  background: "linear-gradient(180deg, rgba(212,175,55,0.35), rgba(212,175,55,0.18))",
  color: "#FDE68A",
  fontWeight: 900,
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  ...goldBtn,
  opacity: 0.55,
  cursor: "not-allowed",
};

const outlineBtnSmall: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.9)",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 12,
};

const dangerBtnSmall: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid rgba(244,63,94,0.35)",
  background: "rgba(244,63,94,0.10)",
  color: "#fb7185",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};
