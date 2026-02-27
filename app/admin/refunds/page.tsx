import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import RefundsClient from "./RefundsClient";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Refunds</h1>
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
        <h1 style={{ marginTop: 12 }}>Refunds</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  return <RefundsClient />;
}
