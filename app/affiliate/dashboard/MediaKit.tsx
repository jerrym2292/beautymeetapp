import React from 'react';

export default function MediaKit({ code }: { code: string }) {
  const shareUrl = `beautymeetapp.com/book?ref=${code}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied!');
  };

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>Affiliate Media Kit</h2>
      <p style={{ opacity: 0.7, fontSize: 14, marginTop: -8, marginBottom: 20 }}>
        Professional assets to help you share Beauty Meet.
      </p>

      {/* Campaign Strategy Guide */}
      <div style={strategyGuide}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#D4AF37", marginBottom: 8 }}>💡 Pro Marketer Strategy</div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
          <li><b>Target Techs:</b> Mention the low 5% repeat fee to get them to switch from StyleSeat.</li>
          <li><b>Target Clients:</b> Highlight "Luxury House Calls" for busy professionals.</li>
          <li><b>Instagram:</b> Tag @BeautyMeetApp in your stories for a chance to be featured.</li>
        </ul>
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* Shareable Card 1: The "Story" Look */}
        <div style={kitCard}>
          <div style={storyPreview}>
            <div style={storyOverlay}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#D4AF37" }}>BEAUTY MEET</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, lineHeight: 1.1 }}>
                LUXURY BEAUTY<br/>AT YOUR DOOR
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 12 }}>
                Lashes, Brows, & Nails. <br/>Professional techs, mobile service.
              </div>
              <div style={promoCodeBadge}>
                USE CODE: <span style={{ color: "#D4AF37" }}>{code}</span>
              </div>
              <div style={{ fontSize: 10, marginTop: "auto", opacity: 0.6 }}>beautymeetapp.com</div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Instagram Story Template</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Screenshot this to share on your story.</div>
          </div>
        </div>

        {/* Copy-Paste Section */}
        <div style={kitCard}>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Captions & Links</div>
            
            <div style={captionBox}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.5 }}>TIKTOK / IG CAPTION</div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                Finally a beauty app that comes to YOU. 💅✨ Just booked my lashes through Beauty Meet. Use my code <b>{code}</b> for your first booking! #BeautyMeet #MobileBeauty
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.5 }}>YOUR UNIQUE LINK</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input readOnly value={shareUrl} style={inputStyle} />
                <button onClick={copyToClipboard} style={copyBtn}>Copy</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

const strategyGuide: React.CSSProperties = {
  padding: 16,
  background: "rgba(212,175,55,0.05)",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 12,
  marginBottom: 24,
};

const kitCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  overflow: "hidden",
};

const storyPreview: React.CSSProperties = {
  aspectRatio: "9/16",
  maxHeight: "400px",
  margin: "0 auto",
  background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: 30,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const storyOverlay: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.3)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  padding: 20,
  textAlign: "center",
  background: "rgba(0,0,0,0.2)",
};

const promoCodeBadge: React.CSSProperties = {
  marginTop: 20,
  padding: "8px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  alignSelf: "center",
};

const captionBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.2)",
  padding: 12,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.05)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  color: "#fff",
  outline: "none",
};

const copyBtn: React.CSSProperties = {
  background: "#D4AF37",
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
