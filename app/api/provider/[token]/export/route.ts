import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    include: {
      bookings: {
        orderBy: { startAt: "asc" },
        include: {
          customer: { select: { fullName: true, phone: true, email: true } },
          service: { select: { name: true } },
          payments: {
            orderBy: { createdAt: "asc" },
            select: { type: true, status: true, amountCents: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!provider) return new Response("Invalid link", { status: 404 });

  const headers = [
    "bookingId",
    "startAt",
    "status",
    "isMobile",
    "customerName",
    "customerPhone",
    "customerEmail",
    "service",
    "servicePrice",
    "travelFee",
    "platformFee",
    "deposit",
    "total",
    "payments",
  ];

  const lines = [headers.join(",")];

  for (const b of provider.bookings) {
    const payments = (b.payments || [])
      .map((p) => `${p.type}:${p.status}:$${(p.amountCents / 100).toFixed(2)}@${new Date(p.createdAt).toISOString()}`)
      .join(" | ");

    const row = [
      b.id,
      new Date(b.startAt).toISOString(),
      b.status,
      b.isMobile ? "mobile" : "studio",
      b.customer.fullName,
      b.customer.phone,
      b.customer.email || "",
      b.service.name,
      (b.servicePriceCents / 100).toFixed(2),
      (b.travelFeeCents / 100).toFixed(2),
      (b.platformFeeCents / 100).toFixed(2),
      (b.depositCents / 100).toFixed(2),
      (b.totalCents / 100).toFixed(2),
      payments,
    ].map(csvEscape);

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  const name = `beautymeet_${provider.displayName.replace(/\s+/g, "_")}_history.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${name}\"`,
    },
  });
}
