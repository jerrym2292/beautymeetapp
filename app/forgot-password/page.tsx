"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus("done");
  }

  return (
    <main>
      <Link href="/login" style={{ color: "#c7d2fe" }}>
        ← Back
      </Link>
      <h1 style={{ marginTop: 12 }}>Reset password</h1>

      {status === "done" ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>
          If that email exists, a reset link was sent.
        </div>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 420 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={input} />
          <button style={btn} disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Send reset link"}
          </button>
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
  border: "1px solid rgba(99,102,241,0.4)",
  background: "rgba(99,102,241,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
