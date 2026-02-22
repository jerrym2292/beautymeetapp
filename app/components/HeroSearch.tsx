"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState<"ALL" | "LASHES_BROWS" | "NAILS">("ALL");

  const zipValid = useMemo(() => zip.trim().length >= 5, [zip]);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!zipValid) return;
    const qs = new URLSearchParams({ zip: zip.trim(), category });
    router.push(`/book?${qs.toString()}`);
  }

  return (
    <form onSubmit={go} style={{ display: "grid", gap: 10, marginTop: 18 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter your ZIP"
          style={input}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={input as any}>
          <option value="ALL">All services</option>
          <option value="LASHES_BROWS">Lashes/Brows</option>
          <option value="NAILS">Nails</option>
        </select>
      </div>
      <button disabled={!zipValid} style={{ ...btn, opacity: zipValid ? 1 : 0.5 }}>
        Search artists
      </button>
      <div style={{ fontSize: 12, opacity: 0.65 }}>US-wide — availability varies by city.</div>
    </form>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
  fontSize: 15,
};

const btn: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "#F5F2EA",
  color: "#070709",
  fontWeight: 900,
  width: "fit-content",
};
