"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErr(j?.error || "Login failed");
      return;
    }
    setStatus("done");
    window.location.href = "/";
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Login</h1>

      <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 420 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={input} />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={input}
        />
        {status === "error" && err ? <div style={{ color: "#fecaca" }}>{err}</div> : null}
        <button style={btn} disabled={status === "loading"}>
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/forgot-password" style={{ color: "#D4AF37", fontSize: 13 }}>
          Forgot password?
        </Link>
      </form>
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
