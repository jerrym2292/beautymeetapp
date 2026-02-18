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
  affiliateCode: z.string().nullable().optional(),
  intakeAnswers: z.array(z.object({
    questionId: z.string(),
    text: z.string(),
  })).optional(),
});

function parseStartAt(s: string): Date {
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

  const { providerId, fullName, phone, customerZip, serviceId, startAt, isMobile, notes, intakeAnswers, affiliateCode } = parsed.data;

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const service = await prisma.service.findFirst({ 
    where: { id: serviceId, providerId, active: true },
    include: { questions: true }
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const start = parseStartAt(startAt);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });

  // 1. Check for Affiliate & First-Time Status
  let affiliate = null;
  let isFirstBooking = false;
  
  const existingCustomer = await prisma.customer.findUnique({ where: { phone } });
  if (!existingCustomer) {
    isFirstBooking = true;
  } else {
    const previousBooking = await prisma.booking.findFirst({ where: { customerId: existingCustomer.id, status: "COMPLETED" } });
    if (!previousBooking) isFirstBooking = true;
  }

  if (affiliateCode && isFirstBooking) {
    affiliate = await prisma.affiliate.findUnique({ where: { code: affiliateCode.toUpperCase() } });
  }

  // 2. Calculations
  const estimatedMiles = isMobile ? estimateMilesZip(provider.baseZip, customerZip) : 0;
  const travelFeeCents = isMobile ? estimatedMiles * provider.travelRateCents : 0;
  
  let servicePriceCents = service.priceCents;
  if (affiliate) {
    servicePriceCents = Math.round(servicePriceCents * 0.9); // 10% discount
  }

  const totalCents = servicePriceCents + travelFeeCents; 
  const platformFeeCents = Math.round(servicePriceCents * 0.05); 
  const depositCents = Math.round(totalCents * 0.2); 
  
  // Split platform fee with affiliate (2.5% of service price)
  const affiliateCommissionCents = affiliate ? Math.floor(platformFeeCents * 0.5) : 0;

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
      affiliateId: affiliate?.id,
      affiliateCommissionCents,
      intakeAnswers: intakeAnswers ? {
        create: intakeAnswers.map(a => ({
          questionId: a.questionId,
          text: a.text
        }))
      } : undefined
    },
    select: { id: true },
  });

  const stripe = getStripe();
  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_creation: "if_required",
    success_url: `${baseUrl}/book/success?bookingId=${booking.id}&cancelToken=${customerCancelToken}`,
    cancel_url: `${baseUrl}/book/cancel?bookingId=${booking.id}`,
    metadata: { bookingId: booking.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: totalCents,
          product_data: {
            name: `${provider.displayName} — ${service.name}`,
            description: affiliate ? `Discount applied (Code: ${affiliate.code})` : (isMobile ? `Mobile (${estimatedMiles} mi est.)` : `In-studio`),
          },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: provider.stripeAccountId!,
      },
      metadata: { bookingId: booking.id, providerId: provider.id },
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentIntentId: session.payment_intent as string },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, checkoutUrl: session.url });
}
