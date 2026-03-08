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
      <Link href="/" style={{ color: "#FF69B4", textDecoration: "none", fontWeight: 700 }}>
        ← Back to Home
      </Link>
      <h1 style={{ marginTop: 20, fontSize: 32, fontWeight: 900 }}>Book an Artist</h1>
      <div style={{ opacity: 0.7, marginTop: 4, fontSize: 16 }}>
        Follow our simple 2-step process to find your perfect match.
      </div>

      {/* Step 1: Choose service */}
      <section style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#FF69B4", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={stepNumber}>1</span> Choose a service
        </div>

        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <select value={category} onChange={(e) => {
            setCategory(e.target.value as any);
            setSelectedService(null);
            setResults([]);
            setStatus("idle");
          }} style={input as any}>
            <option value="ALL">All Categories</option>
            <option value="LASHES_BROWS">Lashes/Brows</option>
            <option value="NAILS">Nails</option>
            <option value="HAIR">Hair</option>
            <option value="BRAIDS">Braids</option>
          </select>

          {servicesStatus === "loading" ? (
            <div style={{ opacity: 0.7, fontSize: 14, textAlign: "center", padding: 20 }}>Loading services…</div>
          ) : null}

          {servicesStatus === "done" ? (
            <div style={{ display: "grid", gap: 12 }}>
              {services.map((s) => {
                const active = selectedService?.name === s.name && selectedService?.category === s.category;
                return (
                  <button
                    key={`${s.category}::${s.name}`}
                    onClick={() => setSelectedService(s)}
                    style={{
                      ...serviceBtn,
                      borderColor: active ? "#D4AF37" : "rgba(255,255,255,0.10)",
                      background: active ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                      boxShadow: active ? "0 0 15px rgba(212,175,55,0.1)" : "none"
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 16, color: active ? "#D4AF37" : "#fff" }}>{s.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                      Starting at ${(s.fromPriceCents / 100).toFixed(2)} • {s.durationMin} min • {humanCategory(s.category)}
                    </div>
                  </button>
                );
              })}

              {services.length === 0 && servicesStatus === "done" ? (
                <div style={{ opacity: 0.6, fontSize: 14, textAlign: "center", padding: 20 }}>
                  No services listed in this category yet.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* Step 2: Location + results */}
      <section style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#FF69B4", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={stepNumber}>2</span> Find Artists Near You
        </div>

        <form onSubmit={search} style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Enter your ZIP code (required)"
            style={input}
          />

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <select value={String(radius)} onChange={(e) => setRadius(Number(e.target.value) as any)} style={input as any}>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
            </select>

            <div style={{ ...pill, opacity: selectedService ? 1 : 0.5 }}>
              {selectedService ? `${selectedService.name}` : "Pick a service above"}
            </div>
          </div>

          <button disabled={!zipValid || !selectedService || status === "loading"} style={btn}>
            {status === "loading" ? "Searching Artists…" : "Search Available Techs"}
          </button>
        </form>

        {status === "error" && error ? <div style={{ marginTop: 15, color: "#fecaca", textAlign: "center" }}>{error}</div> : null}
      </section>

      {status === "done" ? (
        <section style={{ marginTop: 40 }}>
          <div style={{ opacity: 0.8, fontSize: 15, marginBottom: 20, textAlign: "center" }}>
            We found <b>{results.length}</b> verified techs matching your request.
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {results.map((p) => (
              <div key={p.id} style={{ ...card, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{p.displayName}</div>
                    <div style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
                      {p.distanceMiles} miles away • {p.mode} • {p.baseCity}, {p.baseState}
                    </div>
                  </div>
                  <div style={verifiedBadge}>VERIFIED</div>
                </div>

                <div style={{ marginTop: 20, fontWeight: 800, fontSize: 14, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Services</div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {p.services.slice(0, 4).map((s) => (
                    <div key={s.id} style={resultServiceRow}>
                      <span>{s.name}</span>
                      <span style={{ fontWeight: 800 }}>${(s.priceCents / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/p/${p.id}`}
                  style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none", marginTop: 20, background: "#FF69B4", borderColor: "#FF69B4", color: "#fff" }}
                >
                  View Profile & Book
                </Link>
              </div>
            ))}

            {results.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 20, textAlign: "center", padding: 40, background: "rgba(255,255,255,0.02)", borderRadius: 20 }}>
                No techs found for this service in your area yet.<br/>
                Try a larger radius or check back soon!
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
  marginTop: 24,
  padding: 30,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
};

const stepNumber: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#FF69B4",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 900
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  outline: "none",
  fontSize: 16,
  boxSizing: "border-box"
};

const btn: React.CSSProperties = {
  padding: "16px 24px",
  borderRadius: 14,
  border: "1px solid #D4AF37",
  background: "#D4AF37",
  color: "#000",
  fontWeight: 900,
  width: "100%",
  fontSize: 16,
  cursor: "pointer",
  transition: "all 0.2s"
};

const serviceBtn: React.CSSProperties = {
  textAlign: "left",
  padding: "16px 20px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  cursor: "pointer",
  transition: "all 0.2s"
};

const pill: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.3)",
  color: "rgba(255,255,255,0.8)",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const verifiedBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  background: "rgba(212,175,55,0.15)",
  color: "#D4AF37",
  padding: "4px 10px",
  borderRadius: 20,
  border: "1px solid rgba(212,175,55,0.3)",
  letterSpacing: "0.05em"
};

const resultServiceRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: 14
};
