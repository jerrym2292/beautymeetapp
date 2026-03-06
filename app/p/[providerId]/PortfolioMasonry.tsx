"use client";

export default function PortfolioMasonry({ photosJson }: { photosJson: string | null }) {
  if (!photosJson) return null;
  
  let photos: string[] = [];
  try {
    photos = JSON.parse(photosJson);
  } catch (e) {
    return null;
  }

  if (photos.length === 0) return null;

  const isImage = (u: string) => {
    const lower = u.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      lower.includes("cdninstagram")
    );
  };

  const images = photos.filter(isImage);
  const links = photos.filter((u) => !isImage(u));

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#D4AF37" }}>Portfolio</h3>

      {links.length > 0 ? (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {links.map((url, i) => {
            let label = url;
            try {
              label = new URL(url).hostname.replace(/^www\./, "");
            } catch {}

            return (
              <a
                key={url + i}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#D4AF37",
                  fontWeight: 900,
                  textDecoration: "none",
                  overflowWrap: "anywhere",
                }}
              >
                {label}
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75, color: "rgba(255,255,255,0.8)" }}>{url}</div>
              </a>
            );
          })}
        </div>
      ) : null}

      {images.length > 0 ? (
        <div style={{ columns: "2 200px", columnGap: "12px", width: "100%" }}>
          {images.map((url, i) => (
            <div
              key={url + i}
              style={{
                marginBottom: "12px",
                breakInside: "avoid",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                transition: "transform 0.2s ease",
              }}
            >
              <img
                src={url}
                alt={`Work ${i + 1}`}
                style={{ width: "100%", display: "block", height: "auto" }}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
