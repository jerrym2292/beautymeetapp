"use client";

import { useState } from "react";
import Link from "next/link";

type Payment = {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  paymentIntentId: string | null;
};

type Booking = {
  id: string;
  createdAt: string;
  status: string;
  totalCents: number;
  customer: { fullName: string; phone: string };
  provider: { displayName: string };
  service: { name: string };
  payments: Payment[];
};

export default function RefundsClient() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setBooking(null);
    const id = bookingId.trim();
    if (!id) return;

    setLoading(true);
    const res = await fetch(`/api/admin/bookings/${id}`);
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error || "Not found");
      return;
    }

    setBooking(j.booking);
  }

  async function refund(paymentId: string) {
    if (!confirm("Refund this payment?")) return;

    const res = await fetch(`/api/admin/refund`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Refund failed");
      return;
    }
    alert(`Refund created: ${j.refundId}`);
    await load();
  }

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Refunds</h1>

      <section style={card}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Enter a booking id to view payments and issue refunds.
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Booking ID"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={load} disabled={loading} style={{ ...btn, width: 140 }}>
            {loading ? "Loading…" : "Load"}
          </button>
        </div>

        {err ? <div style={{ color: "#fecaca", marginTop: 10 }}>{err}</div> : null}

        {booking ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={{ ...card, marginTop: 0 }}>
              <div style={{ fontWeight: 800 }}>
                {booking.customer.fullName} — {booking.service.name}
              </div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                Provider: {booking.provider.displayName} • Status: {booking.status}
              </div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                Total: ${(booking.totalCents / 100).toFixed(2)}
              </div>
            </div>

            <div style={{ ...card, marginTop: 0 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Payments</div>
              {booking.payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{p.type}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>Status: {p.status}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>
                        Amount: ${(p.amountCents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        style={{ ...btn, width: 130, opacity: p.status === "CAPTURED" ? 1 : 0.5 }}
                        disabled={p.status !== "CAPTURED"}
                        onClick={() => refund(p.id)}
                      >
                        Refund
                      </button>
                    </div>
                  </div>
                  {p.paymentIntentId ? (
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                      PI: {p.paymentIntentId}
                    </div>
                  ) : null}
                </div>
              ))}
              {booking.payments.length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 12 }}>No payments recorded.</div>
              ) : null}
            </div>
          </div>
        ) : null}
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

const inputStyle: React.CSSProperties = {
  width: "100%",
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
