"use client";

import { useState } from "react";

export default function ModeToggle({ token, initialMode }: { token: string; initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);

  async function updateMode(newMode: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/provider/${token}/mode`, {
        method: "POST",
        body: JSON.stringify({ mode: newMode }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setMode(newMode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
      {["FIXED", "MOBILE", "BOTH"].map((m) => (
        <button
          key={m}
          onClick={() => updateMode(m)}
          disabled={saving}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: mode === m ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
            background: mode === m ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
            color: mode === m ? "#D4AF37" : "#fff",
            fontWeight: mode === m ? "800" : "400",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          {m === "FIXED" ? "Studio Only" : m === "MOBILE" ? "Mobile Only" : "Both"}
        </button>
      ))}
    </div>
  );
}
