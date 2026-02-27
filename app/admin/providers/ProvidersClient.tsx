"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CreateProviderForm from "./CreateProviderForm";

type ProviderRow = {
  id: string;
  createdAt: string;
  displayName: string;
  active: boolean;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  application: {
    fullName: string;
    phone: string;
    email: string | null;
  };
};

export default function ProvidersClient() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/admin/providers`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error || "Failed to load providers");
      setLoading(false);
      return;
    }
    setProviders(j.providers || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return providers;
    return providers.filter((p) => {
      const hay = `${p.displayName} ${p.application.fullName} ${p.application.phone} ${p.application.email || ""} ${p.id}`.toLowerCase();
      return hay.includes(f);
    });
  }, [providers, filter]);

  async function toggleActive(providerId: string, current: boolean) {
    const res = await fetch(`/api/admin/providers/${providerId}/toggle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Toggle failed");
      return;
    }
    await load();
  }

  async function removeProvider(providerId: string, displayName: string) {
    if (!confirm(`Are you sure you want to REMOVE ${displayName}?\n\nThis will permanently delete the provider ONLY if they have no bookings. Otherwise it will fail and you should hide them instead.`)) {
      return;
    }

    const res = await fetch(`/api/admin/providers/${providerId}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Remove failed");
      return;
    }

    await load();
  }

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Manage Providers</h1>

      <CreateProviderForm onCreated={load} />

      <section style={card}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            disabled={loading}
            onClick={load}
            style={{ ...buttonStyle, width: "auto" }}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter providers…"
            style={{ ...inputStyle, flex: 1, minWidth: 220 }}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Hide/disable, or remove (only if no bookings).
          </div>
        </div>

        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{ ...card, marginTop: 0, opacity: p.active ? 1 : 0.6 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{p.displayName}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    ({p.application.fullName})
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: p.active
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(248,113,113,0.2)",
                    color: p.active ? "#4ade80" : "#f87171",
                  }}
                >
                  {p.active ? "ACTIVE / VISIBLE" : "HIDDEN"}
                </div>
              </div>

              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>
                {p.application.phone}{" "}
                {p.application.email ? `• ${p.application.email}` : ""}
              </div>

              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                Stripe:{" "}
                {p.stripeAccountId
                  ? p.stripeChargesEnabled
                    ? "✅ Ready"
                    : "⏳ Pending onboarding"
                  : "❌ Not connected"}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => toggleActive(p.id, p.active)}
                  style={{ ...buttonStyle, flex: 1, minWidth: 180 }}
                >
                  {p.active ? "Hide Profile" : "Make Visible"}
                </button>

                <button
                  onClick={() => removeProvider(p.id, p.displayName)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    minWidth: 180,
                    borderColor: "rgba(248,113,113,0.5)",
                    background: "rgba(248,113,113,0.12)",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading ? (
            <div style={{ opacity: 0.8, marginTop: 8 }}>
              No providers match.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
