import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <Link href="/" style={{ color: "#c7d2fe" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Admin</h1>
        <p style={{ opacity: 0.85 }}>Please log in.</p>
        <p>
          <Link href="/login" style={{ color: "#c7d2fe" }}>
            Go to login
          </Link>
        </p>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main>
        <Link href="/" style={{ color: "#c7d2fe" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Admin</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  return <AdminClient />;
}
