import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TechCancelConfirmPage({
  params,
}: {
  params: Promise<{ token: string; bookingId: string }>;
}) {
  const { token, bookingId } = await params;

  const provider = await prisma.provider.findUnique({ where: { accessToken: token } });
  if (!provider) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Not authorized</h1>
      </main>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, providerId: provider.id },
    include: { customer: true, service: true },
  });

  if (!booking) {
    return (
      <main>
        <Link href={`/tech/${token}`} style={{ color: "#D4AF37" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ marginTop: 12 }}>Booking not found</h1>
      </main>
    );
  }

  return (
    <main>
      <Link href={`/tech/${token}`} style={{ color: "#D4AF37" }}>
        ← Back to dashboard
      </Link>

      <h1 style={{ marginTop: 12 }}>Are you sure?</h1>
      <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>
        <div>
          <b>{booking.customer.fullName}</b> — {booking.service.name}
        </div>
        <div>{new Date(booking.startAt).toLocaleString()} • {booking.isMobile ? "Mobile" : "In-studio"}</div>
      </div>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Cancel (tech can’t do it / too busy)</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          This issues a <b>full refund</b> (releases the authorization).
        </div>
        <form action={`/api/provider/${token}/booking/${booking.id}/cancel`} method="post" style={{ marginTop: 10 }}>
          <input type="hidden" name="reason" value="TECH" />
          <button style={{ ...btn, borderColor: "rgba(248,113,113,0.55)", background: "rgba(248,113,113,0.12)" }} type="submit">
            Yes — cancel with full refund
          </button>
        </form>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 900 }}>Customer no-show</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          This keeps the <b>20% security deposit</b> and releases the rest.
        </div>
        <form action={`/api/provider/${token}/booking/${booking.id}/cancel`} method="post" style={{ marginTop: 10 }}>
          <input type="hidden" name="reason" value="NO_SHOW" />
          <button style={{ ...btn, borderColor: "rgba(251,191,36,0.55)", background: "rgba(251,191,36,0.10)" }} type="submit">
            Yes — mark no-show (keep deposit)
          </button>
        </form>
      </section>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <Link
          href={`/tech/${token}`}
          style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none" }}
        >
          Go back
        </Link>
        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.65 }}>
          (Nothing will happen unless you choose one of the options above.)
        </div>
      </div>
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

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 900,
  width: "100%",
};
