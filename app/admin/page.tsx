import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Admin</h1>
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
        <h1 style={{ marginTop: 12 }}>Admin</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Admin dashboard</h1>
      
      <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
        <Link href="/admin/approvals" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Provider Approvals</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>Review and approve new beauty technicians.</div>
        </Link>

        <Link href="/admin/affiliates" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Affiliate Management</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>Manage affiliate codes and balance payouts.</div>
        </Link>

        <Link href="/admin/issues" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Customer Issues</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
            Review and resolve customer-reported issues (remainder charging paused).
          </div>
        </Link>

        <Link href="/admin/search" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Search</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
            Look up customers, techs, and bookings.
          </div>
        </Link>

        <Link href="/admin/providers" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Providers</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
            Add, hide/disable, or remove technician accounts.
          </div>
        </Link>

        <Link href="/admin/bookings" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Bookings Ops</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
            Search, reschedule, cancel, no-show, issues, and charging.
          </div>
        </Link>

        <Link href="/admin/refunds" style={adminCard}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Refunds</div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
            Refund deposits/remainders by booking.
          </div>
        </Link>
      </div>
    </main>
  );
}

const adminCard: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  textDecoration: "none",
  color: "inherit",
  display: "block"
};
