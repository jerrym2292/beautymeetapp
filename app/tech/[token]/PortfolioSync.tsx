"use client";

import { useState } from "react";

export default function PortfolioSync({ token, initialUrls }: { token: string, initialUrls: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const formData = new FormData(e.currentTarget);
    const instagramUrl = formData.get("instagramUrl") as string;

    try {
      // For MVP, we'll simulate a scraper or use a direct URL capture
      // In production, this would hit an endpoint that uses Scrapfly to fetch IG images
      const res = await fetch(`/api/provider/${token}/portfolio/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setUrls(data.urls);
        setMessage("Portfolio synced successfully!");
      } else {
        setMessage(data.error || "Failed to sync portfolio");
      }
    } catch (err) {
      setMessage("An error occurred during sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <form onSubmit={handleSync} style={{ display: "flex", gap: 8 }}>
        <input 
          name="instagramUrl" 
          placeholder="Instagram Profile URL (e.g. instagram.com/tech_name)" 
          style={inputStyle}
          required
        />
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Syncing..." : "Sync Photos"}
        </button>
      </form>
      
      {message && <div style={{ fontSize: 12, marginTop: 8, color: message.includes("success") ? "#86efac" : "#fca5a5" }}>{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginTop: 12 }}>
        {urls.map((url, i) => (
          <img key={i} src={url} alt={`Portfolio ${i}`} style={{ width: "100%", borderRadius: 8, aspectRatio: "1/1", objectFit: "cover" }} />
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
  fontSize: 13
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 13
};
