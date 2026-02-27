"use client";

import { useState } from "react";

type Props = { onCreated: () => Promise<void> | void };

export default function CreateProviderForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [baseZip, setBaseZip] = useState("");
  const [baseCity, setBaseCity] = useState("TBD");
  const [baseState, setBaseState] = useState("GA");

  async function submit() {
    setErr(null);
    setLoading(true);
    const res = await fetch(`/api/admin/providers/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName,
        fullName,
        phone,
        email: email || null,
        baseZip,
        baseCity,
        baseState,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error || "Create failed");
      return;
    }

    alert(`Created provider: ${j?.provider?.displayName}\nTech link: /tech/${j?.provider?.accessToken}`);

    setDisplayName("");
    setFullName("");
    setPhone("");
    setEmail("");
    setBaseZip("");
    setBaseCity("TBD");
    setBaseState("GA");
    setOpen(false);

    await onCreated();
  }

  return (
    <section style={card}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ ...buttonStyle, width: "auto" }}
      >
        {open ? "Close" : "+ Add a Provider"}
      </button>

      {open ? (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {err ? <div style={{ color: "#fecaca" }}>{err}</div> : null}

          <input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={input} />
          <input placeholder="Legal full name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={input} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
          <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="Base ZIP" value={baseZip} onChange={(e) => setBaseZip(e.target.value)} style={{ ...input, flex: 1 }} />
            <input placeholder="State" value={baseState} onChange={(e) => setBaseState(e.target.value.toUpperCase().slice(0,2))} style={{ ...input, width: 90 }} />
          </div>
          <input placeholder="City" value={baseCity} onChange={(e) => setBaseCity(e.target.value)} style={input} />

          <button disabled={loading} onClick={submit} style={buttonStyle}>
            {loading ? "Creating…" : "Create Provider"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            This creates an APPROVED provider + tech link immediately.
          </div>
        </div>
      ) : null}
    </section>
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

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
