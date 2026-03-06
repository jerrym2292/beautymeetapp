import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { safeMilesBetweenZips } from "@/lib/geo";
import { getStripe } from "@/lib/stripe";
import { calculateTravelSurcharge } from "@/lib/geoUtils";
import zipcodes from "zipcodes";

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

  const prepInstructions = (service as any).prepInstructions;

  const start = parseStartAt(startAt);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });

  // 1. Check for First-Time Status
  let affiliate = null;
  let isFirstBooking = false;
  
  const existingCustomer = await prisma.customer.findUnique({ where: { phone } });
  if (!existingCustomer) {
    isFirstBooking = true;
  } else {
    const previousBooking = await prisma.booking.findFirst({ where: { customerId: existingCustomer.id, status: "COMPLETED" } });
    if (!previousBooking) isFirstBooking = true;
  }

  // Affiliate code only applies to first-time bookings
  if (affiliateCode && isFirstBooking) {
    affiliate = await prisma.affiliate.findUnique({ where: { code: affiliateCode.toUpperCase() } });
  }

  // 2. Pricing Calculations
  const estimatedMiles = isMobile ? estimateMilesZip(provider.baseZip, customerZip) : 0;
  
  // Custom Travel Zone Surcharge Detection
  let zoneSurchargeCents = 0;
  if (isMobile) {
    const zipData = zipcodes.lookup(customerZip);
    if (zipData && zipData.latitude && zipData.longitude) {
      const surcharge = calculateTravelSurcharge(
        { lat: zipData.latitude, lng: zipData.longitude },
        provider.travelZonesJson,
        provider.travelZoneSurchargesJson
      );
      zoneSurchargeCents = Math.round(surcharge * 100);
    }
  }

  const travelFeeCents = isMobile ? (estimatedMiles * provider.travelRateCents) + zoneSurchargeCents : 0;
  
  const baseServicePriceCents = service.priceCents;
  
  // Platform Fee Logic:
  // - First Time: 5% platform + 10% affiliate (if applicable) = 15% (or 5% if no affiliate)
  // - Repeat: 5% platform
  let platformFeeCents = Math.round(baseServicePriceCents * 0.05);
  let affiliateCommissionCents = 0;

  if (isFirstBooking && affiliate) {
    affiliateCommissionCents = Math.round(baseServicePriceCents * 0.10);
  }

  // Total Deducted from Provider Payout (Platform 5% + Affiliate 10%)
  const totalDeductedCents = platformFeeCents + affiliateCommissionCents;

  // Stripe Fee Logic: 3% added on top for customer
  const stripeFeeCents = Math.round((baseServicePriceCents + travelFeeCents) * 0.03);

  // Grand Total for Customer: Price + Travel + Stripe Fee
  const totalCents = baseServicePriceCents + travelFeeCents + stripeFeeCents;

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { fullName },
    create: { fullName, phone },
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
      servicePriceCents: baseServicePriceCents,
      platformFeeCents,
      stripeFeeCents,
      depositCents: Math.round(totalCents * 0.2), // 20% deposit
      travelFeeCents,
      totalCents,
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

  // Create payment record linked to booking (Booking no longer stores a single paymentId)
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      status: "REQUIRES_PAYMENT",
      amountCents: totalCents,
      currency: "USD",
      provider: "stripe",
      type: "DEPOSIT",
    },
    select: { id: true },
  });

  const stripe = getStripe();
  const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

  // Final Stripe Session
  // NOTE: `transfer_data.destination` + `application_fee_amount` require Stripe Connect.
  // In local/dev, providers may not have a connected account yet; in that case we fall back
  // to a standard Checkout session (no destination transfer) so the rest of the booking flow
  // can be tested end-to-end.
  const connectPayoutEnabled = !!provider.stripeAccountId;

  const checkoutParams = {
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
          unit_amount: baseServicePriceCents + travelFeeCents,
          product_data: {
            name: `${provider.displayName} — ${service.name}`,
            description: (isMobile ? `Mobile Appointment (${estimatedMiles} mi)` : `In-Studio`) + (prepInstructions ? ` | ${prepInstructions}` : ""),
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: stripeFeeCents,
          product_data: {
            name: `Processing Fee`,
            description: `3% secure payment processing`,
          },
        },
      }
    ],
    payment_intent_data: {
      capture_method: "manual",
      metadata: { bookingId: booking.id, providerId: provider.id, connectPayoutEnabled: String(connectPayoutEnabled) },
      ...(connectPayoutEnabled ? {
        application_fee_amount: totalDeductedCents, // Platform keeps 5% (+ 10% affiliate on first booking)
        transfer_data: { destination: provider.stripeAccountId! },
      } : {}),
    },
  } as const;

  let session;
  try {
    session = await stripe.checkout.sessions.create(checkoutParams as any);
  } catch (e: any) {
    // If the connected account exists but isn't fully onboarded (missing transfers capability),
    // Stripe will reject `transfer_data.destination`. Fall back to a non-Connect session so
    // the booking flow can still be exercised.
    if (connectPayoutEnabled && e?.param === "payment_intent_data[transfer_data][destination]") {
      const fallbackParams = {
        ...checkoutParams,
        payment_intent_data: {
          capture_method: "manual",
          metadata: { bookingId: booking.id, providerId: provider.id, connectPayoutEnabled: "false" },
        },
      };
      session = await stripe.checkout.sessions.create(fallbackParams as any);
    } else {
      throw e;
    }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentIntentId: session.payment_intent as string },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, checkoutUrl: session.url });
}
