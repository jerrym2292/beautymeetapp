"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppRow = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verificationStatus: string | null;
  verificationDetailsJson: string | null;
  categoryLicensesJson: string | null;
  appliedCategoriesJson: string | null;
  zip: string | null;
};

export default function AdminClient() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/admin/applications`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error || "Failed to load applications");
      setLoading(false);
      return;
    }
    setApps(j.applications || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(a: AppRow) {
    const displayName = prompt("Display name for provider (shown to customers):", a.fullName);
    if (!displayName) return;
    const baseZip = prompt("Provider base ZIP:", a.zip || "");
    if (!baseZip) return;

    const res = await fetch(`/api/admin/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId: a.id, displayName, baseZip }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Approve failed");
      return;
    }

    await load();
  }

  async function reject(appId: string) {
    const notes = prompt("Rejection reason (optional):") || null;
    const res = await fetch(`/api/admin/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, notes }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Reject failed");
      return;
    }

    await load();
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Admin approvals</h1>

      <section style={card}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={loading} onClick={load} style={{ ...buttonStyle, width: "auto" }}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Pending provider applications.</div>
        </div>

        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {apps.map((a) => (
            <div key={a.id} style={{ ...card, marginTop: 0 }}>
              <div style={{ fontWeight: 800 }}>{a.fullName}</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                {a.phone} {a.email ? `• ${a.email}` : ""}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                Submitted: {new Date(a.createdAt).toLocaleString()}
              </div>

              {a.verificationStatus ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: 8,
                    borderRadius: 8,
                    fontSize: 12,
                    background: a.verificationStatus === "VERIFIED" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                    border: `1px solid ${a.verificationStatus === "VERIFIED" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                    color: a.verificationStatus === "VERIFIED" ? "#86efac" : "#fcd34d",
                  }}
                >
                  <strong>Verification: {a.verificationStatus}</strong>
                  {a.verificationDetailsJson && (
                    <div style={{ marginTop: 4, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                      {a.verificationDetailsJson}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.5, fontStyle: "italic" }}>
                  No auto-verification record found.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={() => approve(a)} style={{ ...buttonStyle, flex: 1 }}>
                  Approve
                </button>
                <button
                  onClick={() => reject(a.id)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    borderColor: "rgba(248,113,113,0.5)",
                    background: "rgba(248,113,113,0.12)",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {apps.length === 0 && !loading ? (
            <div style={{ opacity: 0.8, marginTop: 8 }}>No pending applications.</div>
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
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
