import Link from "next/link";

export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const sp = await searchParams;
  const bookingId = sp.bookingId;
  return (
    <main>
      <Link href="/" style={{ color: "#c7d2fe" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Payment cancelled</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        No charge was made. You can go back and try again.
      </p>
      {bookingId ? (
        <p style={{ opacity: 0.7, fontSize: 13 }}>Booking ID: {bookingId}</p>
      ) : null}
    </main>
  );
}
