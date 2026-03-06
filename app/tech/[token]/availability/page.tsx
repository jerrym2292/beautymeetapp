import Link from "next/link";
import AvailabilityEditor from "./ui";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main style={mainContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={`/tech/${token}`} style={{ color: "#D4AF37", textDecoration: "none", fontSize: 14 }}>
          ← Back to dashboard
        </Link>
        <div style={{ fontSize: 12, opacity: 0.7 }}>BeautyMeet • Availability</div>
      </div>

      <h1 style={{ marginTop: 18, marginBottom: 6, fontSize: 28, letterSpacing: "-0.02em" }}>
        Availability
      </h1>
      <div style={{ opacity: 0.75, marginBottom: 18, fontSize: 14 }}>
        Set your weekly schedule, buffers, and time off. This controls what clients can book.
      </div>

      <AvailabilityEditor token={token} />
    </main>
  );
}

const mainContainer: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "radial-gradient(circle at top, #111827, #000)",
  color: "white",
};
