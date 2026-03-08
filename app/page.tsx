import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main style={{ paddingBottom: 100 }}>
      {/* Hero Section */}
      <header style={heroSection}>
        <div style={{ maxWidth: 800 }}>
          <div style={badge}>The Nation's Elite Beauty Collective</div>
          <h1 style={heroTitle}>
            Where Artistry Meets <span style={{ color: "#D4AF37" }}>Ownership</span>.
          </h1>
          <p style={heroSub}>
            Book top-tier <span style={{ color: "#FF69B4" }}>Lash, Hair, Braid, and Nail</span> artists who prioritize quality over volume. 
            Join the collective that empowers beauty professionals with fair fees and better tools.
          </p>
          <div style={heroActions}>
            <Link href="/book" style={primaryButton}>Book an Appointment</Link>
            {!user && <Link href="/tech/apply" style={secondaryButton}>Apply as Artist</Link>}
            {user && <Link href={user.role === "AFFILIATE" ? "/affiliate/dashboard" : user.role === "ADMIN" ? "/admin" : user.providerId ? `/tech/${user.providerId}` : "/tech/dashboard"} style={secondaryButton}>My Dashboard</Link>}
          </div>
        </div>
      </header>

      {/* Why Beauty Meet? (The Standout Features) */}
      <section style={{ marginTop: 100 }}>
        <h2 style={{ fontSize: 36, textAlign: "center", marginBottom: 12, fontWeight: 900 }}>Why Beauty Meet?</h2>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: 50, maxWidth: 600, margin: "0 auto 50px" }}>
          We aren't just another booking app. We're a community-first platform designed to solve the biggest headaches in the beauty industry.
        </p>
        
        <div style={featureGrid}>
          <div style={featureCard}>
            <div style={featureIcon}>✨</div>
            <h3 style={featureTitle}>Elite Talent Only</h3>
            <p style={featureText}>We vet every artist. When you book on Beauty Meet, you're booking with a verified professional who takes their craft seriously.</p>
          </div>
          <div style={featureCard}>
            <div style={featureIcon}>💖</div>
            <h3 style={featureTitle}>Fair to the Pros</h3>
            <p style={featureText}>Unlike others who take 20-30%, we charge a tiny flat fee. This means your artist keeps more of their hard-earned money.</p>
          </div>
          <div style={featureCard}>
            <div style={featureIcon}>⚡</div>
            <h3 style={featureTitle}>Seamless Booking</h3>
            <p style={featureText}>Our new 2-step booking flow is designed for speed. Pick your service, enter your zip, and you're done.</p>
          </div>
          <div style={featureCard}>
            <div style={featureIcon}>📱</div>
            <h3 style={featureTitle}>Portfolio First</h3>
            <p style={featureText}>See real work from real clients. We prioritize visual portfolios so you know exactly the style of work you're getting.</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ marginTop: 100, padding: "80px 40px", borderRadius: 32, background: "rgba(255,105,180,0.05)", border: "1px solid rgba(255,105,180,0.2)" }}>
        <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 40, fontWeight: 900 }}>The Real Difference</h2>
        <div style={comparisonGrid}>
          <div style={comparisonCard}>
            <h4 style={compHeader}>The "Big" Apps</h4>
            <p style={compSub}>Vagaro, StyleSeat, Booksy</p>
            <ul style={compList}>
              <li>❌ 15-30% "New Client" Tax</li>
              <li>❌ Fees on every repeat booking</li>
              <li>❌ Bloated, confusing interfaces</li>
              <li>❌ Hard to get discovered as a new pro</li>
            </ul>
          </div>
          <div style={{ ...comparisonCard, border: "2px solid #D4AF37", background: "rgba(0,0,0,0.4)" }}>
            <h4 style={{ ...compHeader, color: "#D4AF37" }}>Beauty Meet</h4>
            <p style={compSub}>The Fair Alternative</p>
            <ul style={compList}>
              <li>✅ Flat $2.50 Platform Fee</li>
              <li>✅ Pros keep 100% of their service price</li>
              <li>✅ Clean, premium, focused UI</li>
              <li>✅ "Rising Star" algorithm for new talent</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTAs */}
      <section style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30 }}>
        <div style={ctaBox}>
          <h2 style={{ fontSize: 28, marginBottom: 12, fontWeight: 900 }}>Ready to glow?</h2>
          <p style={{ opacity: 0.8, marginBottom: 24, fontSize: 17 }}>Browse the best local artists and book your next session in seconds.</p>
          <Link href="/book" style={{ ...ctaButton, background: "#FF69B4", color: "#fff", border: "none" }}>Find an Artist</Link>
        </div>

        <div style={{ ...ctaBox, border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.08)" }}>
          <h2 style={{ fontSize: 28, marginBottom: 12, fontWeight: 900, color: "#D4AF37" }}>Join the Collective</h2>
          <p style={{ opacity: 0.8, marginBottom: 24, fontSize: 17 }}>Take control of your business and stop paying the "loyalty tax."</p>
          <Link href="/tech/apply" style={{ ...ctaButton, background: "#D4AF37", color: "#000", border: "none" }}>Apply as Artist</Link>
        </div>
      </section>

      <footer style={{ marginTop: 100, opacity: 0.5, fontSize: 14, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 40 }}>
        © 2026 Beauty Meet. All rights reserved. <br/>
        <span style={{ color: "#FF69B4" }}>Pink</span> • <span style={{ color: "#D4AF37" }}>Gold</span> • <span style={{ color: "#fff" }}>Black</span>
      </footer>
    </main>
  );
}

const heroSection: React.CSSProperties = {
  padding: "120px 0 100px",
  textAlign: "center",
  margin: "0 auto",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 16px",
  borderRadius: 30,
  background: "rgba(255,105,180,0.15)",
  color: "#FF69B4",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 20,
  border: "1px solid rgba(255,105,180,0.3)"
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(42px, 9vw, 72px)",
  fontWeight: 900,
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  marginBottom: 28,
};

const heroSub: React.CSSProperties = {
  fontSize: 21,
  opacity: 0.8,
  lineHeight: 1.6,
  marginBottom: 40,
  maxWidth: 700,
  margin: "0 auto 40px"
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 16,
  justifyContent: "center",
  flexWrap: "wrap"
};

const primaryButton: React.CSSProperties = {
  padding: "20px 40px",
  borderRadius: 16,
  background: "#D4AF37",
  color: "#000",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 18,
  transition: "all 0.2s ease"
};

const secondaryButton: React.CSSProperties = {
  padding: "20px 40px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 18
};

const featureGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 24
};

const featureCard: React.CSSProperties = {
  padding: 32,
  borderRadius: 28,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center"
};

const featureIcon: React.CSSProperties = {
  fontSize: 40,
  marginBottom: 20
};

const featureTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 12,
  color: "#FF69B4"
};

const featureText: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.7,
  lineHeight: 1.6
};

const comparisonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 30,
};

const comparisonCard: React.CSSProperties = {
  padding: 40,
  borderRadius: 28,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const compHeader: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  marginBottom: 6
};

const compSub: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.5,
  marginBottom: 24,
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const compList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 16,
  fontSize: 16
};

const ctaBox: React.CSSProperties = {
  padding: 50,
  borderRadius: 32,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  textAlign: "center"
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 36px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 18
};
