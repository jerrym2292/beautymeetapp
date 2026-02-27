import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Customer</h1>
        <p style={{ opacity: 0.85 }}>Please log in.</p>
        <p>
          <Link href="/login" style={{ color: "#D4AF37" }}>
            Go to login
          </Link>
        </p>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Customer</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        include: {
          provider: { select: { id: true, displayName: true } },
          service: { select: { id: true, name: true } },
          payments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              status: true,
              amountCents: true,
              paymentIntentId: true,
            },
          },
        },
        take: 50,
      },
    },
  });

  if (!customer) {
    return (
      <main>
        <Link href="/admin/search" style={{ color: "#D4AF37" }}>
          ← Search
        </Link>
        <h1 style={{ marginTop: 12 }}>Customer not found</h1>
        <div style={{ opacity: 0.7 }}>ID: {id}</div>
      </main>
    );
  }

  const totalSpendCents = customer.bookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);

  return (
    <main>
      <Link href="/admin/search" style={{ color: "#D4AF37" }}>
        ← Search
      </Link>
      <h1 style={{ marginTop: 12 }}>Customer</h1>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{customer.fullName}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              {customer.phone}
              {customer.email ? ` • ${customer.email}` : ""}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>ID: {customer.id}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Created: {new Date(customer.createdAt).toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900 }}>${(totalSpendCents / 100).toFixed(2)}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total booked (gross)</div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              Referral code: <b>{customer.referralCode || "—"}</b>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Next discount: <b>{customer.nextBookingDiscountPct || 0}%</b>
            </div>
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Bookings</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {customer.bookings.map((b) => (
            <div key={b.id} style={{ ...miniCard, marginTop: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {b.service.name} • with {b.provider.displayName}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Booking: {b.id}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Start: {new Date(b.startAt).toLocaleString()} • Status: <b>{b.status}</b>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>${(b.totalCents / 100).toFixed(2)}</div>
                  <a
                    href={`/api/admin/bookings/${b.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#D4AF37", fontSize: 12 }}
                  >
                    View booking JSON
                  </a>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Payments: {b.payments.map((p) => `${p.type}:${p.status}($${(p.amountCents / 100).toFixed(2)})`).join(" • ") || "—"}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={`/admin/providers/${b.provider.id}`} style={linkBtn}>
                  Provider details
                </Link>
                <Link href={`/admin/refunds`} style={linkBtn}>
                  Refunds tool
                </Link>
              </div>
            </div>
          ))}

          {customer.bookings.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No bookings yet.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const miniCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const linkBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
};
