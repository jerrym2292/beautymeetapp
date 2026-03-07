"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

type ServiceCard = {
  name: string;
  category: string;
  fromPriceCents: number;
  durationMin: number;
};

type Category = "ALL" | "LASHES_BROWS" | "NAILS" | "HAIR" | "BRAIDS";

export default function BookPage() {
  const sp = useSearchParams();

  const [category, setCategory] = useState<Category>((sp.get("category") as any) || "ALL");
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [servicesStatus, setServicesStatus] = useState<"idle" | "loading" | "error" | "done">("idle");

  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);

  const [zip, setZip] = useState(sp.get("zip") || "");
  const [radius, setRadius] = useState<10 | 25 | 50>((Number(sp.get("radius")) as any) || 25);
  const [name, setName] = useState(sp.get("name") || "");

  const [results, setResults] = useState<Provider[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const zipValid = useMemo(() => zip.trim().length >= 5, [zip]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServicesStatus("loading");
      try {
        const res = await fetch(`/api/services?category=${encodeURIComponent(category)}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "Failed to load services");
        if (cancelled) return;
        setServices(j.services || []);
        setServicesStatus("done");
      } catch (e) {
        if (!cancelled) {
          setServices([]);
          setServicesStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!zipValid || !selectedService) return;

    setStatus("loading");
    setError(null);

    const res = await fetch(
      `/api/search/providers?zip=${encodeURIComponent(zip)}` +
        `&radius=${radius}` +
        `&category=${encodeURIComponent(selectedService.category)}` +
        `&serviceName=${encodeURIComponent(selectedService.name)}` +
        `${name.trim() ? `&name=${encodeURIComponent(name.trim())}` : ""}`,
      { cache: "no-store" }
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
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        Pick a service, then we’ll show you the best techs near your ZIP.
      </div>

      {/* Step 1: Choose service */}
      <section style={card}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Step 1 — Choose a service</div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <select value={category} onChange={(e) => {
            setCategory(e.target.value as any);
            setSelectedService(null);
            setResults([]);
            setStatus("idle");
          }} style={input as any}>
            <option value="ALL">All categories</option>
            <option value="LASHES_BROWS">Lashes/Brows</option>
            <option value="NAILS">Nails</option>
            <option value="HAIR">Hair</option>
            <option value="BRAIDS">Braids</option>
          </select>

          {servicesStatus === "loading" ? (
            <div style={{ opacity: 0.7, fontSize: 13 }}>Loading services…</div>
          ) : null}

          {servicesStatus === "done" ? (
            <div style={{ display: "grid", gap: 10 }}>
              {services.map((s) => {
                const active = selectedService?.name === s.name && selectedService?.category === s.category;
                return (
                  <button
                    key={`${s.category}::${s.name}`}
                    onClick={() => setSelectedService(s)}
                    style={{
                      ...serviceBtn,
                      borderColor: active ? "rgba(212,175,55,0.7)" : "rgba(255,255,255,0.10)",
                      background: active ? "rgba(212,175,55,0.16)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{s.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                      From ${(s.fromPriceCents / 100).toFixed(2)} • {s.durationMin} min • {humanCategory(s.category)}
                    </div>
                  </button>
                );
              })}

              {services.length === 0 ? (
                <div style={{ opacity: 0.8, fontSize: 13 }}>
                  No services listed yet in this category.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* Step 2: Location + results */}
      <section style={card}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Step 2 — Enter your ZIP</div>

        <form onSubmit={search} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Enter your ZIP (required)"
            style={input}
          />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by tech name (optional)"
            style={input}
          />

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <select value={String(radius)} onChange={(e) => setRadius(Number(e.target.value) as any)} style={input as any}>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
            </select>

            <div style={{ ...pill, opacity: selectedService ? 1 : 0.55 }}>
              {selectedService ? `${selectedService.name}` : "Select a service first"}
            </div>
          </div>

          <button disabled={!zipValid || !selectedService || status === "loading"} style={btn}>
            {status === "loading" ? "Searching…" : "Find techs"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            You’ll get results after selecting a service and entering ZIP.
          </div>
        </form>

        {status === "error" && error ? <div style={{ marginTop: 10, color: "#fecaca" }}>{error}</div> : null}
      </section>

      {status === "done" ? (
        <section style={{ marginTop: 14 }}>
          <div style={{ opacity: 0.85 }}>
            Found <b>{results.length}</b> techs within <b>{radius} miles</b>.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {results.map((p) => (
              <div key={p.id} style={card}>
                <div style={{ fontWeight: 900, fontSize: 17 }}>{p.displayName}</div>
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

                <div style={{ marginTop: 10, fontWeight: 800, opacity: 0.9 }}>Matching services</div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, opacity: 0.9 }}>
                  {p.services.slice(0, 6).map((s) => (
                    <li key={s.id} style={{ marginBottom: 6 }}>
                      {s.name} — ${(s.priceCents / 100).toFixed(2)} ({s.durationMin}m)
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {results.length === 0 ? (
              <div style={{ opacity: 0.85, marginTop: 10 }}>
                No techs found yet for that service in this radius. Try a larger radius or a different ZIP.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function humanCategory(c: string) {
  if (c === "LASHES_BROWS") return "Lashes/Brows";
  if (c === "NAILS") return "Nails";
  if (c === "HAIR") return "Hair";
  if (c === "BRAIDS") return "Braids";
  return c;
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
  fontWeight: 900,
  width: "100%",
};

const serviceBtn: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  cursor: "pointer",
};

const pill: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.20)",
  color: "rgba(255,255,255,0.9)",
  fontWeight: 800,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};
