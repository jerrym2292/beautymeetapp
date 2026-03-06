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

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#D4AF37" }}>Portfolio</h3>
      <div style={{ 
        columns: "2 200px", 
        columnGap: "12px",
        width: "100%" 
      }}>
        {photos.map((url, i) => (
          <div key={i} style={{ 
            marginBottom: "12px", 
            breakInside: "avoid",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            transition: "transform 0.2s ease"
          }}>
            <img 
              src={url} 
              alt={`Work ${i + 1}`} 
              style={{ 
                width: "100%", 
                display: "block",
                height: "auto"
              }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
