"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PaymentRow = {
  id: string;
  type: string;
  status: string;
  amountCents: number;
};

type BookingRow = {
  id: string;
  createdAt: string;
  status: string;
  startAt: string;
  isMobile: boolean;
  totalCents: number;
  depositCents: number;
  issueReportedAt: string | null;
  providerConfirmedAt: string | null;
  customerConfirmedAt: string | null;
  completedAt: string | null;
  provider: { id: string; displayName: string };
  customer: { id: string; fullName: string; phone: string };
  service: { id: string; name: string };
  payments: PaymentRow[];
};

const STATUSES = [
  "",
  "PENDING",
  "APPROVED",
  "DECLINED",
  "CANCELLED",
  "NO_SHOW",
  "COMPLETED",
] as const;

export default function BookingsClient() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => q.trim(), [q]);

  async function load() {
    setLoading(true);
    setErr(null);

    const url = new URL(window.location.origin + "/api/admin/bookings");
    if (status) url.searchParams.set("status", status);
    if (query) url.searchParams.set("q", query);
    url.searchParams.set("limit", "80");

    const res = await fetch(url.toString());
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error || "Failed to load bookings");
      return;
    }
    setRows(j.bookings || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query]);

  async function act(bookingId: string, kind: string, extra?: any) {
    const pretty = kind.replace(/_/g, " ");
    if (
      [
        "cancel",
        "reschedule",
        "mark_done",
        "mark_no_show",
        "report_issue",
        "clear_issue",
        "retry_remainder",
        "force_charge_remainder",
      ].includes(kind)
    ) {
      // most are destructive-ish
      const ok =
        kind === "reschedule"
          ? true
          : confirm(`Are you sure you want to ${pretty}?`);
      if (!ok) return;
    }

    const body: any = { kind, ...(extra || {}) };
    const res = await fetch(`/api/admin/bookings/${bookingId}/action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Action failed");
      return;
    }
    await load();
  }

  async function reschedule(b: BookingRow) {
    const current = new Date(b.startAt);
    const proposed = prompt(
      "New start time (YYYY-MM-DD HH:mm) in server timezone:",
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(
        current.getDate()
      ).padStart(2, "0")} ${String(current.getHours()).padStart(2, "0")}:${String(
        current.getMinutes()
      ).padStart(2, "0")}`
    );
    if (!proposed) return;

    // Best-effort parse. Server will validate.
    await act(b.id, "reschedule", { startAt: proposed });
  }

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Bookings Ops</h1>

      <section style={card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button disabled={loading} onClick={load} style={{ ...btn, width: "auto" }}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...input, width: 180 }}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "All statuses"}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: customer / phone / provider / booking id"
            style={{ ...input, flex: 1, minWidth: 240 }}
          />
        </div>

        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>{rows.length} result(s)</div>
      </section>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {rows.map((b) => (
          <div key={b.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900 }}>
                  {b.customer.fullName} — {b.service.name} — {b.provider.displayName}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Start: {new Date(b.startAt).toLocaleString()} • Status: <b>{b.status}</b>
                  {b.issueReportedAt ? " • ⚠️ issue" : ""}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Booking: {b.id}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900 }}>${(b.totalCents / 100).toFixed(2)}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  deposit ${(b.depositCents / 100).toFixed(2)} • {b.isMobile ? "mobile" : "studio"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              Payments: {b.payments.map((p) => `${p.type}:${p.status}($${(p.amountCents / 100).toFixed(2)})`).join(" • ") || "—"}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => reschedule(b)} style={{ ...btn, width: "auto" }}>
                Reschedule (notify tech)
              </button>
              <button onClick={() => act(b.id, "cancel")} style={{ ...btn, width: "auto" }}>
                Cancel (refund deposit)
              </button>
              <button onClick={() => act(b.id, "mark_done")} style={{ ...btn, width: "auto" }}>
                Mark done
              </button>
              <button onClick={() => act(b.id, "mark_no_show")} style={{ ...btn, width: "auto" }}>
                Mark no-show
              </button>

              {!b.issueReportedAt ? (
                <button onClick={() => act(b.id, "report_issue")} style={{ ...btn, width: "auto" }}>
                  Report issue (pause charge)
                </button>
              ) : (
                <button onClick={() => act(b.id, "clear_issue")} style={{ ...btn, width: "auto" }}>
                  Clear issue
                </button>
              )}

              <button onClick={() => act(b.id, "retry_remainder")} style={{ ...btn, width: "auto" }}>
                Retry remainder
              </button>
              <button
                onClick={() => act(b.id, "force_charge_remainder")}
                style={{ ...btn, width: "auto", borderColor: "rgba(248,113,113,0.5)" }}
              >
                Force charge remainder
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/admin/customers/${b.customer.id}`} style={linkBtn}>
                Customer
              </Link>
              <Link href={`/admin/providers/${b.provider.id}`} style={linkBtn}>
                Provider
              </Link>
              <a href={`/api/admin/bookings/${b.id}`} target="_blank" rel="noreferrer" style={linkBtn}>
                Booking JSON
              </a>
              <Link href={`/admin/refunds`} style={linkBtn}>
                Refunds tool
              </Link>
            </div>
          </div>
        ))}

        {rows.length === 0 && !loading ? (
          <div style={{ opacity: 0.75, marginTop: 10 }}>No bookings found.</div>
        ) : null}
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
};

const linkBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
};
