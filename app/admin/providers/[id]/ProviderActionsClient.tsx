"use client";

import { useState } from "react";

export default function ProviderActionsClient({
  providerId,
  displayName,
  active,
}: {
  providerId: string;
  displayName: string;
  active: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const verb = active ? "HIDE" : "MAKE VISIBLE";
    if (!confirm(`Are you sure you want to ${verb} ${displayName}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/admin/providers/${providerId}/toggle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      alert(j?.error || "Toggle failed");
      return;
    }

    location.reload();
  }

  async function remove() {
    if (!confirm(`Are you sure you want to REMOVE ${displayName}?\n\nThis only works if there is no booking history.`)) return;

    setLoading(true);
    const res = await fetch(`/api/admin/providers/${providerId}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      alert(j?.error || "Remove failed");
      return;
    }

    location.href = "/admin/providers";
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button disabled={loading} onClick={toggle} style={btn}>
        {active ? "Hide" : "Make Visible"}
      </button>
      <button
        disabled={loading}
        onClick={remove}
        style={{
          ...btn,
          borderColor: "rgba(248,113,113,0.5)",
          background: "rgba(248,113,113,0.12)",
        }}
      >
        Remove
      </button>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
};
