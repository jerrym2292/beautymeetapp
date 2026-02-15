import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { safeMilesBetweenZips } from "@/lib/geo";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Body = z.object({
  providerId: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  customerZip: z.string().min(5).max(10),
  serviceId: z.string().min(1),
  startAt: z.string().min(10),
  isMobile: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

function parseStartAt(s: string): Date {
  // Accept "YYYY-MM-DD HH:MM" or ISO
  if (s.includes("T")) return new Date(s);
  const parts = s.trim().split(/\s+/);
  if (parts.length !== 2) return new Date("invalid");
  const iso = `${parts[0]}T${parts[1]}:00`;
  return new Date(iso);
}

function estimateMilesZip(fromZip: string, toZip: string): number {
  return Math.round(safeMilesBetweenZips(fromZip, toZip));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  }

  const { providerId, fullName, phone, customerZip, serviceId, startAt, isMobile, notes } = parsed.data;

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  if (!provider.stripeAccountId) {
    return NextResponse.json({ error: "This tech is not ready for payments yet." }, { status: 409 });
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, providerId, active: true } });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const start = parseStartAt(startAt);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });

  const estimatedMiles = isMobile ? estimateMilesZip(provider.baseZip, customerZip) : 0;
  const travelFeeCents = isMobile ? estimatedMiles * provider.travelRateCents : 0;

  const servicePriceCents = service.priceCents;
  const totalCents = servicePriceCents + travelFeeCents; // customer pays this total
  const platformFeeCents = Math.round(servicePriceCents * 0.05); // 5% of service
  const depositCents = Math.round(totalCents * 0.2); // security deposit (20% of total)

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { fullName },
    create: { fullName, phone },
  });

  const payment = await prisma.payment.create({
    data: {
      status: "REQUIRES_PAYMENT",
      amountCents: totalCents,
      currency: "USD",
      provider: "stripe",
    },
    select: { id: true },
  });

  const { randomBytes } = await import("crypto");
  const customerConfirmToken = randomBytes(16).toString("hex");
  const customerCancelToken = randomBytes(16).toString("hex");

  const booking = await prisma.booking.create({
    data: {
      providerId,
      customerId: customer.id,
      serviceId,
      startAt: start,
      notes: notes ?? null,
      isMobile,
      customerZip,
      estimatedMiles: isMobile ? estimatedMiles : null,
      servicePriceCents,
      platformFeeCents,
      depositCents,
      travelFeeCents,
      totalCents,
      paymentId: payment.id,
      customerConfirmToken,
      customerCancelToken,
    },
    select: { id: true },
  });

  // We do NOT charge at request time. We only collect a card to hold the spot.
  // Charge happens automatically only after the tech approves.
  const stripe = getStripe();
  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer_creation: "always",
    success_url: `${baseUrl}/book/success?bookingId=${booking.id}&cancelToken=${customerCancelToken}`,
    cancel_url: `${baseUrl}/book/cancel?bookingId=${booking.id}`,
    metadata: { bookingId: booking.id, paymentId: payment.id },
    setup_intent_data: {
      metadata: { bookingId: booking.id, providerId: provider.id },
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { checkoutSessionId: session.id },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, checkoutUrl: session.url });
}
