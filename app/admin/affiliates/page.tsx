import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Affiliate management</h1>
        <p style={{ opacity: 0.85 }}>Please log in.</p>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Affiliate management</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Affiliate management</h1>
      <p style={{ opacity: 0.75 }}>
        MVP placeholder. Next: list affiliates, balances, payouts, and fraud checks.
      </p>
    </main>
  );
}
