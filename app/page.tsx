import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header style={{ padding: "18px 0" }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Beauty Meet</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>
          Book trusted <b>lash</b>, <b>brow</b>, and <b>nail</b> techs—nationwide.
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
          marginTop: 18,
        }}
      >
        <Link
          href="/book"
          style={cardStyle}
        >
          <div style={cardTitle}>I’m booking</div>
          <div style={cardSub}>
            Browse approved techs and request an appointment.
          </div>
        </Link>

        <Link
          href="/tech/apply"
          style={cardStyle}
        >
          <div style={cardTitle}>I’m a tech / stylist</div>
          <div style={cardSub}>
            Are you a tech / stylist? Apply to join Beauty Meet and start accepting bookings.
          </div>
        </Link>

        <div style={{ opacity: 0.7, fontSize: 13, marginTop: 12 }}>
          Admin page is hidden.
        </div>
      </section>
    </main>
  );
}

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
