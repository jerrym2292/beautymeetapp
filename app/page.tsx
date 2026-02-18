import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main style={{ paddingBottom: 100 }}>
      {/* Hero Section */}
      <header style={heroSection}>
        <div style={{ maxWidth: 700 }}>
          <div style={badge}>Atlanta’s Elite Beauty Collective</div>
          <h1 style={heroTitle}>Where Artistry Meets <span style={{ color: "#D4AF37" }}>Ownership</span>.</h1>
          <p style={heroSub}>
            The only beauty marketplace that doesn't tax your loyalty. 
            Book Atlanta’s top lash, brow, and nail artists—or join the network that respects your bottom line.
          </p>
          <div style={heroActions}>
            <Link href="/book" style={primaryButton}>Find an Artist</Link>
            {!user && <Link href="/login" style={secondaryButton}>Partner Login</Link>}
            {user && <Link href={user.role === "AFFILIATE" ? "/affiliate/dashboard" : user.role === "ADMIN" ? "/admin" : "/tech/dashboard"} style={secondaryButton}>My Dashboard</Link>}
          </div>
        </div>
      </header>

      {/* Comparison Section (Attacking Vagaro/GlossGenius) */}
      <section style={{ marginTop: 80 }}>
        <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 40 }}>The Beauty Meet Advantage</h2>
        <div style={comparisonGrid}>
          <div style={comparisonCard}>
            <h4 style={compHeader}>Legacy Platforms</h4>
            <p style={compSub}>Vagaro, StyleSeat, Booksy</p>
            <ul style={compList}>
              <li>❌ 15-30% "New Client" Fees</li>
              <li>❌ Fees on repeat customers</li>
              <li>❌ Bloated, confusing interfaces</li>
              <li>❌ Review-count gatekeeping</li>
            </ul>
          </div>
          <div style={{ ...comparisonCard, border: "2px solid #D4AF37", background: "rgba(212,175,55,0.05)" }}>
            <h4 style={{ ...compHeader, color: "#D4AF37" }}>Beauty Meet</h4>
            <p style={compSub}>The Modern Alternative</p>
            <ul style={compList}>
              <li>✅ 0% Fee on Repeat Clients</li>
              <li>✅ Flat, transparent platform fee</li>
              <li>✅ Mobile-first, sleek experience</li>
              <li>✅ Rising Star visibility boost</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={gridSection}>
        <div style={strengthCard}>
          <div style={strengthIcon}>📱</div>
          <h3 style={strengthTitle}>Aesthetic Booking</h3>
          <p style={strengthText}>Unlike the clunky UI of GlossGenius, our booking flow is designed to look as good as your work.</p>
        </div>
        <div style={strengthCard}>
          <div style={strengthIcon}>💰</div>
          <h3 style={strengthTitle}>Fast Payouts</h3>
          <p style={strengthText}>Integrated with Stripe Connect. Your money goes straight to your bank, no waiting for weekly cycles.</p>
        </div>
        <div style={strengthCard}>
          <div style={strengthIcon}>📍</div>
          <h3 style={strengthTitle}>Mobile or Studio</h3>
          <p style={strengthText}>Whether you travel to clients or have a fixed spot in ATL, we handle the logistics and travel fees.</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ marginTop: 80, padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: 32, marginBottom: 40, textAlign: "center" }}>Simple for Everyone</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30 }}>
          <div style={{ textAlign: "center" }}>
            <div style={stepCircle}>1</div>
            <h4 style={{ marginTop: 16 }}>Discovery</h4>
            <p style={{ opacity: 0.6, fontSize: 14 }}>Browse verified Atlanta artists by their real work, not just stars.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={stepCircle}>2</div>
            <h4 style={{ marginTop: 16 }}>Seamless Booking</h4>
            <p style={{ opacity: 0.6, fontSize: 14 }}>Pick a time, fill out the intake form, and pay your deposit.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={stepCircle}>3</div>
            <h4 style={{ marginTop: 16 }}>The Experience</h4>
            <p style={{ opacity: 0.6, fontSize: 14 }}>Meet your artist at their studio or your home and enjoy your service.</p>
          </div>
        </div>
      </section>

      {/* User Type CTA Section */}
      <section style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div style={ctaBox}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Need an Appointment?</h2>
          <p style={{ opacity: 0.8, marginBottom: 20 }}>Join the thousands of Atlanta locals booking through Beauty Meet.</p>
          <Link href="/book" style={ctaButton}>Book Now</Link>
        </div>

        <div style={{ ...ctaBox, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.05)" }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Ready to Scale?</h2>
          <p style={{ opacity: 0.8, marginBottom: 20 }}>Stop paying "referral fees" for clients you already know. Join the collective.</p>
          <Link href="/tech/apply" style={{ ...ctaButton, background: "#D4AF37", color: "#000" }}>Apply as Artist</Link>
        </div>
      </section>

      {/* Affiliate Promo */}
      <section style={affiliateSection}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>Earn with Beauty Meet</h2>
          <p style={{ opacity: 0.8 }}>Join our Affiliate program and earn 2.5% on every booking you refer. Forever.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" style={{ ...secondaryButton, padding: "12px 24px", fontSize: 14 }}>Affiliate Login</Link>
          <Link href="/affiliate/register" style={affiliateLink}>Sign Up to Refer →</Link>
        </div>
      </section>

      <footer style={{ marginTop: 80, opacity: 0.4, fontSize: 13, textAlign: "center" }}>
        © 2026 Beauty Meet. All rights reserved. Built for Atlanta Artists.
      </footer>
    </main>
  );
}

const heroSection: React.CSSProperties = {
  padding: "100px 0 80px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: 20,
  background: "rgba(212,175,55,0.15)",
  color: "#D4AF37",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 16
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(40px, 8vw, 64px)",
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.03em",
  marginBottom: 24
};

const heroSub: React.CSSProperties = {
  fontSize: 20,
  opacity: 0.7,
  lineHeight: 1.5,
  marginBottom: 32,
  maxWidth: 600
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const primaryButton: React.CSSProperties = {
  padding: "18px 36px",
  borderRadius: 14,
  background: "#F5F2EA",
  color: "#070709",
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 17
};

const secondaryButton: React.CSSProperties = {
  padding: "18px 36px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#F5F2EA",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 17
};

const comparisonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const comparisonCard: React.CSSProperties = {
  padding: 32,
  borderRadius: 24,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const compHeader: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 4
};

const compSub: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.5,
  marginBottom: 20
};

const compList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 12,
  fontSize: 15
};

const gridSection: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 24,
  marginTop: 80
};

const strengthCard: React.CSSProperties = {
  padding: 32,
  borderRadius: 24,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const strengthIcon: React.CSSProperties = {
  fontSize: 32,
  marginBottom: 16
};

const strengthTitle: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  marginBottom: 12
};

const strengthText: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.6,
  lineHeight: 1.6
};

const stepCircle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "1px solid #D4AF37",
  color: "#D4AF37",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  fontWeight: 800,
  margin: "0 auto"
};

const ctaBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 28,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 28px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.1)",
  color: "#F5F2EA",
  fontWeight: 700,
  textDecoration: "none"
};

const affiliateSection: React.CSSProperties = {
  marginTop: 80,
  padding: 40,
  borderRadius: 28,
  background: "linear-gradient(90deg, rgba(212,175,55,0.12) 0%, rgba(7,7,9,0) 100%)",
  border: "1px solid rgba(212,175,55,0.15)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 32
};

const affiliateLink: React.CSSProperties = {
  color: "#D4AF37",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 17
};

const cardStyle: React.CSSProperties = {
  display: "block",
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  textDecoration: "none",
  color: "inherit",
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const cardSub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.85,
  lineHeight: 1.35,
};
