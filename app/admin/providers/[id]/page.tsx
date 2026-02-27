import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProviderActionsClient from "./ProviderActionsClient";

export const dynamic = "force-dynamic";

export default async function AdminProviderDetailPage({
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
        <h1 style={{ marginTop: 12 }}>Provider</h1>
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
        <h1 style={{ marginTop: 12 }}>Provider</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      application: true,
      services: { orderBy: { createdAt: "desc" } },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          service: { select: { name: true } },
          payments: { select: { type: true, status: true, amountCents: true } },
        },
        take: 50,
      },
    },
  });

  if (!provider) {
    return (
      <main>
        <Link href="/admin/search" style={{ color: "#D4AF37" }}>
          ← Search
        </Link>
        <h1 style={{ marginTop: 12 }}>Provider not found</h1>
        <div style={{ opacity: 0.7 }}>ID: {id}</div>
      </main>
    );
  }

  return (
    <main>
      <Link href="/admin/providers" style={{ color: "#D4AF37" }}>
        ← Providers
      </Link>
      <h1 style={{ marginTop: 12 }}>Provider</h1>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{provider.displayName}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>ID: {provider.id}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Created: {new Date(provider.createdAt).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
              Status: <b>{provider.active ? "ACTIVE / VISIBLE" : "HIDDEN"}</b>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Stripe</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
              {provider.stripeAccountId
                ? provider.stripeChargesEnabled
                  ? "✅ charges enabled"
                  : "⏳ charges pending"
                : "❌ not connected"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              payouts {provider.stripePayoutsEnabled ? "✅ enabled" : "⏳ pending"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ProviderActionsClient
            providerId={provider.id}
            displayName={provider.displayName}
            active={provider.active}
          />
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Application info</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          <div>
            <b>Full name:</b> {provider.application.fullName}
          </div>
          <div>
            <b>Phone:</b> {provider.application.phone}
          </div>
          <div>
            <b>Email:</b> {provider.application.email || "—"}
          </div>
          <div>
            <b>Base:</b> {provider.baseCity}, {provider.baseState} {provider.baseZip}
          </div>
          <div>
            <b>Tech link:</b>{" "}
            <span style={mono}>/tech/{provider.accessToken}</span>
          </div>
          <div>
            <b>Public booking page:</b>{" "}
            <a style={{ color: "#D4AF37" }} href={`/p/${provider.id}`} target="_blank" rel="noreferrer">
              /p/{provider.id}
            </a>
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Services</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {provider.services.map((s) => (
            <div key={s.id} style={miniCard}>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                {s.category} • {s.durationMin} min • ${(s.priceCents / 100).toFixed(2)} • {s.active ? "active" : "inactive"}
              </div>
            </div>
          ))}
          {provider.services.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No services yet.</div>
          ) : null}
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Recent bookings</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {provider.bookings.map((b) => (
            <div key={b.id} style={miniCard}>
              <div style={{ fontWeight: 800 }}>
                {b.customer.fullName} — {b.service.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                {new Date(b.startAt).toLocaleString()} • Status: <b>{b.status}</b>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                Payments: {b.payments.map((p) => `${p.type}:${p.status}($${(p.amountCents / 100).toFixed(2)})`).join(" • ") || "—"}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={`/admin/customers/${b.customer.id}`} style={linkBtn}>
                  Customer details
                </Link>
                <a href={`/api/admin/bookings/${b.id}`} target="_blank" rel="noreferrer" style={linkBtn}>
                  Booking JSON
                </a>
              </div>
            </div>
          ))}

          {provider.bookings.length === 0 ? (
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

const mono: React.CSSProperties = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12,
  opacity: 0.9,
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
