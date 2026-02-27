"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CancelBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [mode, setMode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await params;
      setToken(p.token);
    })();
  }, [params]);

  async function submit() {
    setStatus("submitting");
    setErr(null);
    const res = await fetch(`/api/cancel/${token}`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErr(j?.error || "Failed");
      return;
    }
    setMode(j?.mode || null);
    setStatus("done");
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Cancel booking</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Cancelling within 3 hours keeps the 25% security deposit.
      </p>

      {status === "done" ? (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}>
          Cancelled. {mode === "LATE" ? "Deposit kept." : "No charge."}
        </div>
      ) : (
        <button onClick={submit} disabled={status === "submitting"} style={btn}>
          {status === "submitting" ? "Cancelling…" : "Cancel booking"}
        </button>
      )}

      {status === "error" && err ? (
        <div style={{ marginTop: 12, color: "#fecaca" }}>{err}</div>
      ) : null}
    </main>
  );
}

const btn: React.CSSProperties = {
  marginTop: 14,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(248,113,113,0.55)",
  background: "rgba(248,113,113,0.12)",
  color: "#fee2e2",
  fontWeight: 800,
  width: "100%",
};
