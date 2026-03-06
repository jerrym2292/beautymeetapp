"use client";

import { useState } from "react";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  totalBookings: number;
  lastBookingAt: string | null;
  notes: string | null;
};

export default function ClientListTab({ 
  token, 
  initialClients 
}: { 
  token: string, 
  initialClients: Client[] 
}) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div style={{ padding: 10 }}>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>My Clients</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{clients.length} total</div>
        </div>

        <input 
          style={inputStyle} 
          placeholder="Search by name or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {filteredClients.map(client => (
            <div key={client.id} style={clientCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{client.fullName}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {client.totalBookings} booking{client.totalBookings !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{client.phone}</div>
              {client.lastBookingAt && (
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                  Last visit: {new Date(client.lastBookingAt).toLocaleDateString()}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a href={`tel:${client.phone}`} style={actionBtn}>Call</a>
                <a href={`sms:${client.phone}`} style={actionBtn}>Text</a>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, opacity: 0.5 }}>
              No clients found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const card = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const clientCard = {
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)"
};

const actionBtn = {
  flex: 1,
  textAlign: "center" as const,
  padding: "6px",
  borderRadius: "6px",
  background: "rgba(212,175,55,0.15)",
  color: "#D4AF37",
  fontSize: "12px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  border: "1px solid rgba(212,175,55,0.3)"
};
