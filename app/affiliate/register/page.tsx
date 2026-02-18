"use client";

import { useState } from "react";
import Link from "next/link";

export default function AffiliateRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const res = await fetch("/api/auth/register-affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, code }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || "Registration failed.");
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>← Home</Link>
      <h1 style={{ marginTop: 12 }}>Partner with Beauty Meet</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.4 }}>
        Earn 2.5% commission on every booking you refer. Plus, your friends get 10% off their first booking.
      </p>

      {status === "success" ? (
        <div style={successBox}>
          Welcome to the team! You can now log in to your dashboard to track your referrals.
          <div style={{ marginTop: 12 }}>
            <Link href="/login" style={buttonStyle}>Log in to dashboard</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <Field label="Full name">
            <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} placeholder="Jane Doe" />
          </Field>
          <Field label="Email address">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="jane@example.com" />
          </Field>
          <Field label="Desired Referral Code (e.g. JANE10)">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required style={inputStyle} placeholder="MYCODE" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} minLength={6} />
          </Field>

          {error && <div style={{ color: "#f87171", fontSize: 14 }}>{error}</div>}

          <button disabled={status === "submitting"} style={buttonStyle} type="submit">
            {status === "submitting" ? "Creating account..." : "Join as Affiliate"}
          </button>
        </form>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};

const buttonStyle = {
  marginTop: 16,
  padding: "12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 700,
  width: "100%",
  cursor: "pointer",
  textAlign: "center" as const,
  display: "block",
  textDecoration: "none"
};

const successBox = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.35)",
  lineHeight: 1.5
};
