import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();

  // Redirect if not logged in or not a customer
  if (!user || user.role !== "CUSTOMER") {
    redirect("/login");
  }

  // Get customer record via the user's phone/email match
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: user.email }, // Some setups use phone as email identifier
        { email: user.email },
      ],
    },
    include: {
      bookings: {
        orderBy: { startAt: "desc" },
        include: {
          provider: true,
          service: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!customer) {
    return (
      <main style={container}>
        <h1>Customer Dashboard</h1>
        <p>No customer record found. Please book your first appointment to see it here.</p>
        <Link href="/book" style={btn}>Book Now</Link>
      </main>
    );
  }

  const baseUrl = process.env.APP_BASE_URL || "";
  const referralLink = customer.referralCode
    ? `${baseUrl || ""}/?ref=${customer.referralCode}`.replace(/^\/?\?/, "/?")
    : null;

  return (
    <main style={container}>
      <div style={header}>
        <h1>Welcome, {customer.fullName}</h1>
        <Link href="/api/auth/logout" style={logoutBtn}>Log out</Link>
      </div>

      <section style={section}>
        <h2 style={sectionTitle}>Refer a Friend</h2>
        <div style={refBox}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>
            Share your code. When a new customer completes their first booking, you get <b>10% off</b> your next booking.
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div><b>Your code:</b> <span style={mono}>{customer.referralCode}</span></div>
            {referralLink ? (
              <div><b>Your link:</b> <span style={mono}>{referralLink}</span></div>
            ) : null}
            {customer.nextBookingDiscountPct > 0 ? (
              <div style={{ color: "#4ade80", fontWeight: 800 }}>
                You have {customer.nextBookingDiscountPct}% off waiting for your next booking.
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>
                No discount queued right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Your Service History</h2>
        {customer.bookings.length === 0 ? (
          <div style={emptyState}>
            <p>You haven't booked anything yet.</p>
            <Link href="/book" style={btn}>Find a Professional</Link>
          </div>
        ) : (
          <div style={grid}>
            {customer.bookings.map((b) => (
              <div key={b.id} style={bookingCard}>
                <div style={cardHeader}>
                  <div style={statusBadge(b.status)}>{b.status}</div>
                  <div style={dateStyle}>{new Date(b.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                
                <div style={cardBody}>
                  <div style={serviceName}>{b.service.name}</div>
                  <div style={providerName}>with {b.provider.displayName}</div>
                  <div style={locationInfo}>{b.isMobile ? "🏠 Mobile Service" : "📍 In-Studio"}</div>
                </div>

                <div style={cardFooter}>
                  <div style={priceStyle}>${(b.totalCents / 100).toFixed(2)}</div>
                  <Link href={`/p/${b.providerId}`} style={rebookBtn}>Rebook</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Payment History</h2>
        <div style={refBox}>
          {customer.bookings.flatMap((b) =>
            (b.payments || []).map((p) => ({
              id: p.id,
              bookingId: b.id,
              createdAt: p.createdAt,
              type: p.type,
              status: p.status,
              amountCents: p.amountCents,
              providerName: b.provider.displayName,
              serviceName: b.service.name,
            }))
          ).length === 0 ? (
            <div style={{ opacity: 0.75 }}>No payments yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {customer.bookings
                .flatMap((b) =>
                  (b.payments || []).map((p) => ({
                    id: p.id,
                    bookingId: b.id,
                    createdAt: p.createdAt,
                    type: p.type,
                    status: p.status,
                    amountCents: p.amountCents,
                    providerName: b.provider.displayName,
                    serviceName: b.service.name,
                  }))
                )
                .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
                .slice(0, 50)
                .map((p) => (
                  <div key={p.id} style={{ ...bookingCard, margin: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{p.type} • {p.status}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                          {p.providerName} — {p.serviceName}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                          {new Date(p.createdAt).toLocaleString()} • Booking {p.bookingId}
                        </div>
                      </div>
                      <div style={{ fontWeight: 900 }}>${(p.amountCents / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <section style={profileSection}>
         <h2 style={sectionTitle}>Account Details</h2>
         <div style={profileInfo}>
            <div><b>Phone:</b> {customer.phone}</div>
            <div><b>Email:</b> {customer.email || "Not provided"}</div>
         </div>
      </section>
    </main>
  );
}

const container: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "20px 16px",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 30,
};

const logoutBtn: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.7,
  color: "#f5f5f7",
  textDecoration: "none",
};

const section: React.CSSProperties = {
  marginBottom: 40,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 16,
};

const emptyState: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 20,
  border: "1px dashed rgba(255,255,255,0.1)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const bookingCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  padding: 16,
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const statusBadge = (status: string): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 800,
  padding: "4px 8px",
  borderRadius: 6,
  textTransform: "uppercase",
  background: status === "COMPLETED" ? "rgba(34,197,94,0.2)" : "rgba(212,175,55,0.2)",
  color: status === "COMPLETED" ? "#4ade80" : "#fbbf24",
});

const dateStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
};

const cardBody: React.CSSProperties = {
  marginBottom: 16,
};

const serviceName: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
};

const providerName: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.8,
  marginTop: 2,
};

const locationInfo: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  marginTop: 6,
};

const cardFooter: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 12,
  borderTop: "1px solid rgba(255,255,255,0.05)",
};

const priceStyle: React.CSSProperties = {
  fontWeight: 700,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#D4AF37",
  color: "#000",
  padding: "10px 20px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  marginTop: 10,
};

const rebookBtn: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#D4AF37",
  textDecoration: "none",
};

const profileSection: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.05)",
};

const profileInfo: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.8,
  display: "grid",
  gap: 8,
};

const refBox: React.CSSProperties = {
  padding: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
};

const mono: React.CSSProperties = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12,
  opacity: 0.9,
  wordBreak: "break-all",
};
