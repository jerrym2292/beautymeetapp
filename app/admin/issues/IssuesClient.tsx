"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type IssueRow = {
  id: string;
  startAt: string;
  status: string;
  issueReportedAt: string;
  totalCents: number;
  depositCents: number;
  discountCents: number;
  platformFeeCents: number;
  travelFeeCents: number;
  provider: { id: string; displayName: string };
  customer: { id: string; fullName: string; phone: string };
  service: { id: string; name: string };
  payments: Array<{ id: string; type: string; status: string; amountCents: number }>;
};

export default function IssuesClient() {
  const [rows, setRows] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/admin/issues`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error || "Failed to load issues");
      setLoading(false);
      return;
    }
    setRows(j.issues || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(bookingId: string) {
    if (!confirm("Resolve this issue and resume charging if eligible?")) return;
    const res = await fetch(`/api/admin/issues/${bookingId}/resolve`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Resolve failed");
      return;
    }
    if (j.chargeError) {
      alert(`Issue cleared, but remainder charge did not run: ${j.chargeError}`);
    }
    await load();
  }

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Customer Issues</h1>
      <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
        Bookings where the customer reported an issue. Remainder charging is paused until you resolve.
      </div>

      <section style={card}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={loading} onClick={load} style={{ ...buttonStyle, width: "auto", marginTop: 0 }}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{rows.length} issue(s)</div>
        </div>

        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {rows.map((b) => (
            <div key={b.id} style={{ ...card, marginTop: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{b.customer.fullName}</div>
                  <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                    {b.customer.phone} • {b.service.name} • with {b.provider.displayName}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                    Start: {new Date(b.startAt).toLocaleString()} • Reported: {new Date(b.issueReportedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>${(b.totalCents / 100).toFixed(2)}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    deposit ${(b.depositCents / 100).toFixed(2)} • discount -${(b.discountCents / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    platform ${(b.platformFeeCents / 100).toFixed(2)} • travel ${(b.travelFeeCents / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={() => resolve(b.id)} style={{ ...buttonStyle, flex: 1, minWidth: 220 }}>
                  Resolve issue (resume charging)
                </button>

                <a
                  href={`/api/admin/bookings/${b.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    minWidth: 220,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  View booking JSON
                </a>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Payments: {b.payments.map((p) => `${p.type}:${p.status}`).join(" • ")}
              </div>
            </div>
          ))}

          {rows.length === 0 && !loading ? (
            <div style={{ opacity: 0.8, marginTop: 8 }}>No customer issues right now.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 900,
};
