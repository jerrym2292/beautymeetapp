"use client";

import { useState, useMemo } from "react";

type Booking = {
  id: string;
  startAt: string;
  status: string;
  servicePriceCents: number;
  travelFeeCents: number;
  stripeFeeCents: number;
  platformFeeCents: number;
  totalCents: number;
  customer: { fullName: string };
  service: { name: string };
};

export default function EarningsTab({ bookings }: { bookings: Booking[] }) {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const completedBookings = useMemo(() => 
    bookings.filter(b => b.status === "COMPLETED" || b.status === "APPROVED"), 
    [bookings]
  );

  const filteredByYear = useMemo(() => 
    completedBookings.filter(b => new Date(b.startAt).getFullYear().toString() === year),
    [completedBookings, year]
  );

  const stats = useMemo(() => {
    let gross = 0;
    let fees = 0;
    let net = 0;
    let travel = 0;

    filteredByYear.forEach(b => {
      gross += b.servicePriceCents + b.travelFeeCents;
      fees += b.platformFeeCents;
      travel += b.travelFeeCents;
      net += (b.servicePriceCents + b.travelFeeCents - b.platformFeeCents);
    });

    return { gross, fees, net, travel };
  }, [filteredByYear]);

  const exportCSV = () => {
    const headers = ["Date", "Client", "Service", "Gross ($)", "Travel Fee ($)", "Platform Fee ($)", "Net Payout ($)"];
    const rows = filteredByYear.map(b => [
      new Date(b.startAt).toLocaleDateString(),
      b.customer.fullName,
      b.service.name,
      ((b.servicePriceCents + b.travelFeeCents) / 100).toFixed(2),
      (b.travelFeeCents / 100).toFixed(2),
      (b.platformFeeCents / 100).toFixed(2),
      ((b.servicePriceCents + b.travelFeeCents - b.platformFeeCents) / 100).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `BeautyMeet_Earnings_${year}.csv`);
    link.click();
  };

  return (
    <div style={{ padding: 10 }}>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Earnings & Tax Export</div>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "4px 8px" }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={statBox}>
            <div style={statLabel}>Gross Income</div>
            <div style={statVal}>${(stats.gross / 100).toFixed(2)}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Net Payout</div>
            <div style={statVal}>${(stats.net / 100).toFixed(2)}</div>
          </div>
        </div>

        <div style={{ ...statBox, background: "rgba(212,175,55,0.05)", border: "1px dashed rgba(212,175,55,0.3)" }}>
          <div style={{ fontSize: 12, opacity: 0.8, color: "#D4AF37", fontWeight: 700 }}>💡 Tax Deduction Tip</div>
          <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
            You collected <b>${(stats.travel / 100).toFixed(2)}</b> in travel fees. Keep track of your mileage—you can usually deduct $0.67 per mile driven for business from your taxable income.
          </div>
        </div>

        <button onClick={exportCSV} style={{ ...btn, marginTop: 20 }}>
          📥 Download {year} Tax Report (CSV)
        </button>
      </section>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, opacity: 0.7 }}>Transaction History</div>
        <div style={{ display: "grid", gap: 8 }}>
          {filteredByYear.map(b => (
            <div key={b.id} style={txRow}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{b.customer.fullName}</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{new Date(b.startAt).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: "#86efac" }}>+${((b.servicePriceCents + b.travelFeeCents - b.platformFeeCents) / 100).toFixed(2)}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>Net</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const card = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const statBox = {
  padding: 12,
  borderRadius: 10,
  background: "rgba(255,255,255,0.05)",
};

const statLabel = { fontSize: 11, opacity: 0.6, marginBottom: 4 };
const statVal = { fontSize: 20, fontWeight: 900 };

const txRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.02)",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.05)"
};

const btn = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  background: "#D4AF37",
  color: "black",
  fontWeight: "bold" as const,
  border: "none",
  cursor: "pointer"
};

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  borderRadius: "6px",
  outline: "none"
};
