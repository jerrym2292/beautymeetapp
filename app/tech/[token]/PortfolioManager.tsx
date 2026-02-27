"use client";

import { useState } from "react";

export default function PortfolioManager({ 
  token, 
  initialImages 
}: { 
  token: string; 
  initialImages: { id: string; url: string; caption: string | null }[] 
}) {
  const [images, setImages] = useState(initialImages);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(false);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/provider/${token}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, caption: newCaption }),
      });
      const data = await res.json();
      if (res.ok) {
        setImages([data.image, ...images]);
        setNewUrl("");
        setNewCaption("");
      } else {
        alert(data.error || "Failed to add image");
      }
    } catch (err) {
      alert("Error adding image");
    } finally {
      setLoading(false);
    }
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this photo?")) return;
    
    try {
      const res = await fetch(`/api/provider/${token}/portfolio/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
      }
    } catch (err) {
      alert("Error deleting image");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setNewUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>Your Portfolio</div>
      
      {/* Upload Form */}
      <form onSubmit={addImage} style={uploadBox}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={uploadLabel}>
            {loading ? "Uploading..." : "📁 Upload Image from Device"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ display: "none" }} 
              disabled={loading}
            />
          </label>
          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.5 }}>— OR —</div>
          <input 
            style={input} 
            placeholder="Image URL (e.g. from Instagram)" 
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
          />
        </div>
        <input 
          style={input} 
          placeholder="Caption (optional)" 
          value={newCaption}
          onChange={e => setNewCaption(e.target.value)}
        />
        <button style={btn} type="submit" disabled={loading || !newUrl}>
          {loading ? "Processing..." : "Add to Portfolio"}
        </button>
      </form>

      {/* Grid Display */}
      <div style={grid}>
        {images.map(img => (
          <div key={img.id} style={imgContainer}>
            <img src={img.url} alt={img.caption || ""} style={imgStyle} />
            <button 
              onClick={() => deleteImage(img.id)} 
              style={deleteBtn}
              title="Delete"
            >
              ×
            </button>
            {img.caption && <div style={captionStyle}>{img.caption}</div>}
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div style={{ opacity: 0.5, fontSize: 13, textAlign: "center", padding: 20 }}>
          No portfolio photos yet. Add some to show off your work!
        </div>
      )}
    </div>
  );
}

const uploadLabel: React.CSSProperties = {
  display: "block",
  padding: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  textAlign: "center",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const uploadBox: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
  background: "rgba(255,255,255,0.03)",
  borderRadius: 12,
  border: "1px dashed rgba(255,255,255,0.2)",
  marginBottom: 20,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 12,
};

const imgContainer: React.CSSProperties = {
  position: "relative",
  aspectRatio: "1/1",
  borderRadius: 10,
  overflow: "hidden",
  background: "#000",
  border: "1px solid rgba(255,255,255,0.1)",
};

const imgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const deleteBtn: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: "bold",
};

const captionStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  padding: "4px 8px",
  fontSize: 10,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 13,
};

const btn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: "rgba(212,175,55,0.2)",
  border: "1px solid rgba(212,175,55,0.4)",
  color: "#D4AF37",
  fontWeight: 700,
  cursor: "pointer",
};
