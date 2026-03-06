"use client";

import { useState } from "react";

export default function PortfolioManager({ 
  token, 
  initialHandle, 
  initialPhotos 
}: { 
  token: string, 
  initialHandle: string | null, 
  initialPhotos: string | null 
}) {
  const [handle, setHandle] = useState(initialHandle || "");
  const [photos, setPhotos] = useState<string[]>(initialPhotos ? JSON.parse(initialPhotos) : []);
  const [loading, setLoading] = useState(false);

  async function sync() {
    if (!handle) return;
    setLoading(true);
    const res = await fetch(`/api/provider/${token}/portfolio/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle })
    });
    const j = await res.json();
    if (j.success) {
      setPhotos(j.photos);
      alert("Portfolio synced!");
    } else {
      alert(j.error || "Sync failed");
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input 
          value={handle} 
          onChange={e => setHandle(e.target.value)} 
          placeholder="Instagram Handle (e.g. @nails_by_kim)" 
          style={inputStyle}
        />
        <button onClick={sync} disabled={loading} style={btnStyle}>
          {loading ? "Syncing..." : "Sync Photos"}
        </button>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 8, 
        marginTop: 15 
      }}>
        {photos.map((url, i) => (
          <img 
            key={i} 
            src={url} 
            alt="Portfolio" 
            style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} 
          />
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "white"
};

const btnStyle = {
  padding: "10px 15px",
  borderRadius: "8px",
  background: "#D4AF37",
  color: "black",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer"
};
