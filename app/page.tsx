import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  const dashboardHref = user
    ? user.role === "AFFILIATE"
      ? "/affiliate/dashboard"
      : user.role === "ADMIN"
        ? "/admin"
        : user.providerId
          ? `/tech/${user.providerId}`
          : "/tech/dashboard"
    : null;

  return (
    <main style={{ paddingBottom: 110 }}>
      {/* HERO */}
      <header style={heroSection}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={badge}>Beauty Meet — Book Beautifully. Build Freely.</div>
          <h1 style={heroTitle}>
            Book elite beauty services — and empower the artists behind them.
          </h1>
          <p style={heroSub}>
            Beauty Meet is a portfolio-first booking marketplace for <span style={{ color: "#FF69B4" }}>Lashes</span>,{" "}
            <span style={{ color: "#FF69B4" }}>Hair</span>, <span style={{ color: "#FF69B4" }}>Braids</span>, and{" "}
            <span style={{ color: "#FF69B4" }}>Nails</span> — built for customers and artists across the U.S.
          </p>

          <div style={heroActions}>
            <Link href="/book" style={primaryButton}>
              Book an Appointment
            </Link>
            <Link href="/tech/apply" style={secondaryButton}>
              Apply as an Artist
            </Link>
            {dashboardHref && (
              <Link href={dashboardHref} style={ghostButton}>
                Go to Dashboard
              </Link>
            )}
          </div>

          <div style={trustRow}>
            <div style={trustPill}>Portfolio-first discovery</div>
            <div style={trustPill}>Fast 2-step booking</div>
            <div style={trustPill}>Fair fees for artists</div>
            <div style={trustPill}>Deposits + confirmations</div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section style={{ marginTop: 90 }}>
        <h2 style={sectionTitle}>How it works</h2>
        <p style={sectionSub}>
          Built for real-world beauty booking: clear services, real portfolios, deposits that reduce no-shows, and clean communication.
        </p>

        <div style={stepsGrid}>
          <div style={stepCard}>
            <div style={stepNum}>1</div>
            <h3 style={stepTitle}>Pick a service</h3>
            <p style={stepText}>Choose what you want first — lashes, braids, nails, etc. No endless menus.</p>
          </div>
          <div style={stepCard}>
            <div style={stepNum}>2</div>
            <h3 style={stepTitle}>Enter your ZIP</h3>
            <p style={stepText}>We match you with artists who actually offer that service in your area.</p>
          </div>
          <div style={stepCard}>
            <div style={stepNum}>3</div>
            <h3 style={stepTitle}>Book with confidence</h3>
            <p style={stepText}>View portfolios, confirm availability, pay a deposit, and get instant confirmations.</p>
          </div>
        </div>
      </section>

      {/* FOR CUSTOMERS + FOR PROS */}
      <section style={{ marginTop: 100 }}>
        <div style={twoCol}>
          <div style={panelPink}>
            <h2 style={panelTitle}>
              For customers
              <span style={{ display: "block", color: "#FF69B4" }}>Find your artist, faster.</span>
            </h2>
            <ul style={bulletList}>
              <li><b>Portfolio-first browsing</b> — see real work before you book.</li>
              <li><b>Simple booking flow</b> — pick a service → enter ZIP → choose an artist.</li>
              <li><b>25% deposits</b> to lock in appointments and reduce cancellations.</li>
              <li><b>Custom intake forms</b> for allergies/waivers/preferences before the chair.</li>
              <li><b>Instant confirmations</b> and clear appointment status updates.</li>
            </ul>
            <div style={{ marginTop: 22 }}>
              <Link href="/book" style={{ ...ctaButton, background: "#FF69B4", color: "#fff" }}>
                Browse & Book
              </Link>
            </div>
          </div>

          <div style={panelGold}>
            <h2 style={panelTitle}>
              For artists (techs)
              <span style={{ display: "block", color: "#D4AF37" }}>Keep your money. Keep your clients.</span>
            </h2>
            <ul style={bulletList}>
              <li><b>Fair platform fee</b> — <b>$2.50</b> per booking (no 20–30% cuts).</li>
              <li><b>Rising Star visibility</b> — new talent can get discovered without “review gatekeeping.”</li>
              <li><b>Service + pricing control</b> — build your menu the way you actually work.</li>
              <li><b>Availability & travel zones</b> — support studio and mobile services.</li>
              <li><b>Stripe payouts</b> — get paid like a real business.</li>
              <li><b>Pro membership</b> — <b>$14.99/mo</b> (first <b>3 months free</b> for new artists).</li>
            </ul>
            <div style={{ marginTop: 22 }}>
              <Link href="/tech/apply" style={{ ...ctaButton, background: "#D4AF37", color: "#000" }}>
                Apply as Artist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FULL FEATURE LIST */}
      <section style={{ marginTop: 110 }}>
        <h2 style={sectionTitle}>Everything Beauty Meet includes</h2>
        <p style={sectionSub}>
          Not just “booking.” A full system that supports discovery, scheduling, deposits, intake, and repeat business.
        </p>

        <div style={featureGrid}>
          <Feature icon="📸" title="Portfolio sync + links">Connect your portfolio, add links, and showcase your best work.</Feature>
          <Feature icon="📝" title="Custom intake forms">Collect allergies, style preferences, waivers, and notes before the appointment.</Feature>
          <Feature icon="⏱️" title="Availability management">Set working hours, block time, and control when clients can book.</Feature>
          <Feature icon="📍" title="Travel zones">Offer studio + mobile services with ZIP-based travel coverage.</Feature>
          <Feature icon="💳" title="Deposits + payments">Take deposits to reduce no-shows and keep the calendar solid.</Feature>
          <Feature icon="🔁" title="Rebooking tools">Encourage repeat clients with rebooking options and follow-ups.</Feature>
          <Feature icon="📣" title="Marketing toggles">Turn promos on/off and control how you show up in discovery.</Feature>
          <Feature icon="🛡️" title="Admin support + dispute tools">Built-in admin workflows for issues, refunds, and trust & safety.</Feature>
          <Feature icon="🤝" title="Affiliate referrals">A referral network to help grow customers and pros organically.</Feature>
        </div>
      </section>

      {/* COMPETITOR POSITIONING */}
      <section style={comparisonShell}>
        <h2 style={{ ...sectionTitle, marginBottom: 14 }}>Why we’re better than the “big apps”</h2>
        <p style={sectionSub}>
          Most marketplaces optimize for platform revenue. We optimize for <b>repeat bookings</b>, <b>artist earnings</b>, and <b>customer trust</b>.
        </p>

        <div style={comparisonGrid}>
          <div style={comparisonCard}>
            <h4 style={compHeader}>Legacy platforms</h4>
            <p style={compSub}>StyleSeat • Vagaro • Booksy</p>
            <ul style={compList}>
              <li>❌ High % fees (and “new client” taxes)</li>
              <li>❌ Confusing experiences built for everything (not beauty)</li>
              <li>❌ Review-count gatekeeping hurts new pros</li>
              <li>❌ Portfolios feel secondary to stars</li>
            </ul>
          </div>

          <div style={{ ...comparisonCard, border: "2px solid #D4AF37", background: "rgba(0,0,0,0.45)" }}>
            <h4 style={{ ...compHeader, color: "#D4AF37" }}>Beauty Meet</h4>
            <p style={compSub}>The modern, fair marketplace</p>
            <ul style={compList}>
              <li>✅ Flat $2.50 platform fee per booking</li>
              <li>✅ Portfolio-first discovery (real work wins)</li>
              <li>✅ Rising Star boost for new talent</li>
              <li>✅ Clean booking flow optimized for conversion</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ marginTop: 90, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
        <div style={ctaBox}>
          <h2 style={{ fontSize: 28, marginBottom: 10, fontWeight: 950 }}>Book your next look</h2>
          <p style={{ opacity: 0.8, marginBottom: 22, fontSize: 16, lineHeight: 1.6 }}>
            Pick a service, enter your ZIP, and book with an artist whose work you actually love.
          </p>
          <Link href="/book" style={{ ...ctaButton, background: "#FF69B4", color: "#fff" }}>
            Find an Artist
          </Link>
        </div>

        <div style={{ ...ctaBox, border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.08)" }}>
          <h2 style={{ fontSize: 28, marginBottom: 10, fontWeight: 950, color: "#D4AF37" }}>Grow your business</h2>
          <p style={{ opacity: 0.8, marginBottom: 22, fontSize: 16, lineHeight: 1.6 }}>
            Stop paying huge marketplace cuts. Set your services, take deposits, and get discovered on your work.
          </p>
          <Link href="/tech/apply" style={{ ...ctaButton, background: "#D4AF37", color: "#000" }}>
            Apply as Artist
          </Link>
        </div>
      </section>

      <footer style={footer}>
        © 2026 Beauty Meet. All rights reserved.
        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
          <span style={{ color: "#FF69B4" }}>Pink</span> • <span style={{ color: "#D4AF37" }}>Gold</span> • <span style={{ color: "#fff" }}>Black</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={featureCard}>
      <div style={featureIcon}>{icon}</div>
      <h3 style={featureTitle}>{title}</h3>
      <p style={featureText}>{children}</p>
    </div>
  );
}

const heroSection: React.CSSProperties = {
  padding: "120px 0 80px",
  textAlign: "center",
  margin: "0 auto",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 16px",
  borderRadius: 999,
  background: "rgba(255,105,180,0.12)",
  color: "#FF69B4",
  fontSize: 13,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 22,
  border: "1px solid rgba(255,105,180,0.24)",
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(44px, 7vw, 74px)",
  fontWeight: 950,
  lineHeight: 1.05,
  letterSpacing: "-0.05em",
  marginBottom: 22,
};

const heroSub: React.CSSProperties = {
  fontSize: 20,
  opacity: 0.82,
  lineHeight: 1.65,
  marginBottom: 30,
  maxWidth: 780,
  margin: "0 auto 30px",
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 14,
  justifyContent: "center",
  flexWrap: "wrap",
};

const primaryButton: React.CSSProperties = {
  padding: "18px 34px",
  borderRadius: 16,
  background: "#FF69B4",
  color: "#fff",
  fontWeight: 950,
  textDecoration: "none",
  fontSize: 16,
  border: "1px solid rgba(255,105,180,0.3)",
};

const secondaryButton: React.CSSProperties = {
  padding: "18px 34px",
  borderRadius: 16,
  background: "#D4AF37",
  color: "#000",
  fontWeight: 950,
  textDecoration: "none",
  fontSize: 16,
  border: "1px solid rgba(212,175,55,0.35)",
};

const ghostButton: React.CSSProperties = {
  padding: "18px 34px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 850,
  textDecoration: "none",
  fontSize: 16,
};

const trustRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "center",
  flexWrap: "wrap",
  marginTop: 26,
};

const trustPill: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  fontSize: 13,
  opacity: 0.85,
  fontWeight: 800,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 36,
  textAlign: "center",
  marginBottom: 12,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const sectionSub: React.CSSProperties = {
  textAlign: "center",
  opacity: 0.72,
  marginBottom: 44,
  maxWidth: 720,
  margin: "0 auto 44px",
  lineHeight: 1.65,
  fontSize: 16,
};

const stepsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
};

const stepCard: React.CSSProperties = {
  padding: 28,
  borderRadius: 26,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const stepNum: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  color: "#D4AF37",
  border: "1px solid rgba(212,175,55,0.5)",
  marginBottom: 14,
};

const stepTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  marginBottom: 10,
};

const stepText: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.72,
  lineHeight: 1.65,
  margin: 0,
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 22,
};

const panelPink: React.CSSProperties = {
  padding: 42,
  borderRadius: 32,
  background: "rgba(255,105,180,0.08)",
  border: "1px solid rgba(255,105,180,0.22)",
};

const panelGold: React.CSSProperties = {
  padding: 42,
  borderRadius: 32,
  background: "rgba(212,175,55,0.08)",
  border: "1px solid rgba(212,175,55,0.25)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 28,
  marginBottom: 18,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const bulletList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 10,
  opacity: 0.86,
  lineHeight: 1.65,
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 30px",
  borderRadius: 14,
  fontWeight: 950,
  textDecoration: "none",
  fontSize: 16,
};

const featureGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 18,
};

const featureCard: React.CSSProperties = {
  padding: 28,
  borderRadius: 28,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const featureIcon: React.CSSProperties = {
  fontSize: 30,
  marginBottom: 14,
};

const featureTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  marginBottom: 10,
  color: "#FF69B4",
};

const featureText: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.72,
  lineHeight: 1.65,
  margin: 0,
};

const comparisonShell: React.CSSProperties = {
  marginTop: 110,
  padding: "80px 40px",
  borderRadius: 34,
  background: "rgba(255,105,180,0.05)",
  border: "1px solid rgba(255,105,180,0.2)",
};

const comparisonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 22,
};

const comparisonCard: React.CSSProperties = {
  padding: 36,
  borderRadius: 28,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const compHeader: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
  marginBottom: 6,
};

const compSub: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.55,
  marginBottom: 18,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const compList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 12,
  fontSize: 15,
  opacity: 0.9,
};

const ctaBox: React.CSSProperties = {
  padding: 44,
  borderRadius: 32,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const footer: React.CSSProperties = {
  marginTop: 110,
  opacity: 0.65,
  fontSize: 14,
  textAlign: "center",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  paddingTop: 36,
};
