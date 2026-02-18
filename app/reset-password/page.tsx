"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
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
      <Link href="/login" style={{ color: "#D4AF37" }}>
        ← Login
      </Link>
      <h1 style={{ marginTop: 12 }}>Choose a new password</h1>

      {status === "done" ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>
          Password updated. You can log in now.
        </div>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 420 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            type="password"
            style={input}
          />
          {status === "error" && err ? <div style={{ color: "#fecaca" }}>{err}</div> : null}
          <button style={btn} disabled={status === "loading" || !token}>
            {status === "loading" ? "Saving…" : "Save password"}
          </button>
          {!token ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Missing token.</div>
          ) : null}
        </form>
      )}
    </main>
  );
}

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
