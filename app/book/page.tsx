"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Provider = {
  id: string;
  displayName: string;
  mode: string;
  baseCity: string;
  baseState: string;
  baseZip: string;
  maxTravelMiles: number | null;
  travelRateCents: number;
  distanceMiles: number;
  services: { id: string; name: string; durationMin: number; priceCents: number; category: string }[];
};

export default function BookPage() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState<10 | 25 | 50>(25);
  const [category, setCategory] = useState<"ALL" | "LASHES_BROWS" | "NAILS">("ALL");

  const [results, setResults] = useState<Provider[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const zipValid = useMemo(() => zip.trim().length >= 5, [zip]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!zipValid) return;

    setStatus("loading");
    setError(null);

    const res = await fetch(
      `/api/search/providers?zip=${encodeURIComponent(zip)}&radius=${radius}&category=${category}`
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(j?.error || "Search failed");
      return;
    }

    setResults(j.providers || []);
    setStatus("done");
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Book (USA)</h1>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Find techs near you</div>
        <form onSubmit={search} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Enter your ZIP (required)"
            style={input}
          />

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <select value={String(radius)} onChange={(e) => setRadius(Number(e.target.value) as any)} style={input as any}>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
            </select>

            <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={input as any}>
              <option value="ALL">All</option>
              <option value="LASHES_BROWS">Lashes/Brows</option>
              <option value="NAILS">Nails</option>
            </select>
          </div>

          <button disabled={!zipValid || status === "loading"} style={btn}>
            {status === "loading" ? "Searching…" : "Search"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            ZIP is required before results are shown.
          </div>
        </form>

        {status === "error" && error ? (
          <div style={{ marginTop: 10, color: "#fecaca" }}>{error}</div>
        ) : null}
      </section>

      {status === "done" ? (
        <section style={{ marginTop: 14 }}>
          <div style={{ opacity: 0.85 }}>
            Found <b>{results.length}</b> providers within <b>{radius} miles</b>.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {results.map((p) => (
              <div key={p.id} style={card}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{p.displayName}</div>
                <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                  {p.distanceMiles} miles • {p.mode} • {p.baseCity}, {p.baseState} {p.baseZip}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <a
                    href={`/p/${p.id}`}
                    style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none" }}
                  >
                    Request booking
                  </a>
                </div>

                <div style={{ marginTop: 10, fontWeight: 700, opacity: 0.9 }}>Services</div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, opacity: 0.9 }}>
                  {p.services.slice(0, 8).map((s) => (
                    <li key={s.id} style={{ marginBottom: 6 }}>
                      {s.name} — ${(s.priceCents / 100).toFixed(2)} ({s.durationMin}m)
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {results.length === 0 ? (
              <div style={{ opacity: 0.85, marginTop: 10 }}>
                No providers found yet in that radius. Try a larger radius or a different ZIP.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
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

const input: React.CSSProperties = {
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
  width: "100%",
};
