"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProviderRow = {
  id: string;
  displayName: string;
  active: boolean;
  createdAt: string;
  accessToken?: string | null;
};

type CustomerRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

type BookingRow = {
  id: string;
  status: string;
  createdAt: string;
  startAt: string;
  totalCents: number;
  customer: { fullName: string; phone: string };
  provider: { displayName: string };
};

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const trimmed = useMemo(() => q.trim(), [q]);

  async function run(query: string) {
    const qq = query.trim();
    if (!qq) {
      setProviders([]);
      setCustomers([]);
      setBookings([]);
      return;
    }

    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(qq)}`);
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error || "Search failed");
      return;
    }

    setProviders(j.providers || []);
    setCustomers(j.customers || []);
    setBookings(j.bookings || []);
  }

  useEffect(() => {
    const t = setTimeout(() => run(trimmed), 250);
    return () => clearTimeout(t);
  }, [trimmed]);

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Search (Customers & Techs)</h1>
      <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
        Search by customer name/phone/email, provider display name, or booking id.
      </div>

      <section style={card}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search… (e.g., 'Jessica', '555', email, booking id)"
          style={input}
        />
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
          {loading ? "Searching…" : trimmed ? "" : "Type to search"}
        </div>
        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Providers</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {providers.map((p) => (
            <div key={p.id} style={{ ...miniCard, opacity: p.active ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.displayName}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {p.id}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Created: {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>
                    {p.active ? "ACTIVE" : "HIDDEN"}
                  </div>
                  <a
                    href={`/p/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#D4AF37", fontSize: 12 }}
                  >
                    View public page
                  </a>
                </div>
              </div>
            </div>
          ))}
          {providers.length === 0 ? <div style={{ opacity: 0.75 }}>No providers found.</div> : null}
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Customers</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {customers.map((c) => (
            <div key={c.id} style={miniCard}>
              <div style={{ fontWeight: 800 }}>{c.fullName}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {c.phone}{c.email ? ` • ${c.email}` : ""}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                ID: {c.id} • Created: {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {customers.length === 0 ? <div style={{ opacity: 0.75 }}>No customers found.</div> : null}
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Bookings</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {bookings.map((b) => (
            <div key={b.id} style={miniCard}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{b.customer.fullName} — {b.provider.displayName}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Booking: {b.id}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Start: {new Date(b.startAt).toLocaleString()} • Status: {b.status}
                  </div>
                </div>
                <div style={{ fontWeight: 900 }}>${(b.totalCents / 100).toFixed(2)}</div>
              </div>
            </div>
          ))}
          {bookings.length === 0 ? <div style={{ opacity: 0.75 }}>No bookings found.</div> : null}
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

const miniCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};
