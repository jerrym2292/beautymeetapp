import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AffiliateDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "AFFILIATE" || !user.affiliateId) {
    redirect("/login");
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: user.affiliateId },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          service: true,
          customer: true,
        },
      },
    },
  });

  if (!affiliate) {
    return <div>Affiliate data not found.</div>;
  }

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Affiliate Dashboard</h1>
        <Link href="/api/auth/logout" style={{ fontSize: 13, opacity: 0.7 }}>Log out</Link>
      </div>

      <div style={statsContainer}>
        <div style={statCard}>
          <div style={statLabel}>Referral Code</div>
          <div style={statValue}>{affiliate.code}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Current Balance</div>
          <div style={statValue}>${(affiliate.balanceCents / 100).toFixed(2)}</div>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20 }}>Recent Referrals</h2>
        {affiliate.bookings.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No referrals yet. Share your code to start earning!</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {affiliate.bookings.map((b) => (
              <div key={b.id} style={bookingRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.service.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {b.customer.fullName} • {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#22c55e", fontWeight: 700 }}>
                    +${(b.affiliateCommissionCents / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{b.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: 30, padding: 16, background: "rgba(212,175,55,0.05)", borderRadius: 12, border: "1px dashed rgba(212,175,55,0.3)" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Your Referral Strategy</h3>
        <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 0 }}>
          Direct customers to <b>beautymeetapp.com/book?ref={affiliate.code}</b> to automatically apply your code at checkout.
        </p>
      </div>
    </main>
  );
}

const statsContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginTop: 16,
};

const statCard = {
  padding: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
};

const statLabel = {
  fontSize: 12,
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const statValue = {
  fontSize: 24,
  fontWeight: 800,
  marginTop: 4,
  color: "#D4AF37",
};

const bookingRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 10,
};
