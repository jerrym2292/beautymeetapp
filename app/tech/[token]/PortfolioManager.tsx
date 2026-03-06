"use client";

import { useState } from "react";

export default function PortfolioManager({
  token,
  initialHandle,
  initialPhotos,
}: {
  token: string;
  initialHandle: string | null;
  initialPhotos: string | null;
}) {
  const [handle, setHandle] = useState(initialHandle || "");
  const [links, setLinks] = useState<string[]>(initialPhotos ? JSON.parse(initialPhotos) : []);
  const [newLink, setNewLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveLinks(next: string[]) {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/${token}/portfolio/links`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ links: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setLinks(j.links);
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function addLink() {
    const url = newLink.trim();
    if (!url) return;
    await saveLinks(Array.from(new Set([url, ...links])));
    setNewLink("");
  }

  async function removeLink(idx: number) {
    const next = [...links];
    next.splice(idx, 1);
    await saveLinks(next);
  }

  // Optional: Instagram scrape/sync (requires SCRAPFLY_API_KEY). Keep as a power feature.
  async function syncInstagram() {
    if (!handle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/${token}/portfolio/sync`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const j = await res.json();
      if (j.success) {
        setLinks(j.photos);
        alert("Portfolio synced!");
      } else {
        alert(j.error || "Sync failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Portfolio links</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Paste any link (Instagram / TikTok / Facebook / website)"
          style={inputStyle}
        />
        <button onClick={addLink} disabled={loading} style={btnStyle}>
          Add
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {links.map((url, idx) => {
          let label = url;
          try {
            const h = new URL(url).hostname.replace(/^www\./, "");
            label = h;
          } catch {}

          return (
            <div
              key={url + idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#D4AF37", fontWeight: 900, textDecoration: "none" }}
                >
                  {label}
                </a>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 3, overflowWrap: "anywhere" }}>{url}</div>
              </div>
              <button onClick={() => removeLink(idx)} disabled={loading} style={dangerBtnStyle}>
                Remove
              </button>
            </div>
          );
        })}
        {links.length === 0 ? (
          <div style={{ opacity: 0.65, fontSize: 13 }}>No links yet.</div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, opacity: 0.6, fontSize: 12 }}>
        Optional: Sync images from Instagram (requires Scrapfly).
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Instagram Handle (e.g. @nails_by_kim)"
          style={inputStyle}
        />
        <button onClick={syncInstagram} disabled={loading} style={btnStyle}>
          {loading ? "Syncing..." : "Sync IG"}
        </button>
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
  cursor: "pointer",
} as const;

const dangerBtnStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  background: "rgba(244,63,94,0.15)",
  color: "#fb7185",
  fontWeight: 900,
  border: "1px solid rgba(244,63,94,0.35)",
  cursor: "pointer",
} as const;
