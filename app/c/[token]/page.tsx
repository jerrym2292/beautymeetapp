"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConfirmDonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
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
    const res = await fetch(`/api/confirm/${token}`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErr(j?.error || "Failed");
      return;
    }
    setStatus("done");
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Confirm service completed</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Tap the button below only if the service was completed.
      </p>

      {status === "done" ? (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}>
          Thanks — confirmation received.
        </div>
      ) : (
        <button onClick={submit} disabled={status === "submitting"} style={btn}>
          {status === "submitting" ? "Submitting…" : "Confirm completed"}
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
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
