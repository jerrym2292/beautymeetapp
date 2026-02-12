import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; cancelToken?: string }>;
}) {
  const sp = await searchParams;
  const bookingId = sp.bookingId;
  const cancelToken = sp.cancelToken;
  return (
    <main>
      <Link href="/" style={{ color: "#c7d2fe" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Payment received</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Your booking request is sent to the tech for approval.
      </p>
      {bookingId ? (
        <p style={{ opacity: 0.7, fontSize: 13 }}>Booking ID: {bookingId}</p>
      ) : null}
      <p style={{ opacity: 0.8, marginTop: 10 }}>
        Need to cancel? You can do it here (within 3 hours the 20% deposit is kept):
      </p>
      {cancelToken ? (
        <p style={{ marginTop: 8 }}>
          <a style={{ color: "#c7d2fe" }} href={`/x/${cancelToken}`}>
            /x/{cancelToken}
          </a>
        </p>
      ) : (
        <p style={{ opacity: 0.7, fontSize: 13 }}>
          (Cancel link unavailable)
        </p>
      )}
    </main>
  );
}
