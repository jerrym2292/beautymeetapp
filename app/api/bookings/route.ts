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
  intakeAnswers: z
    .array(
      z.object({
        questionId: z.string(),
        text: z.string(),
      })
    )
    .optional(),
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

const DEPOSIT_PCT = 0.25;

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking request" },
        { status: 400 }
      );
    }

    const {
      providerId,
      fullName,
      phone,
      customerZip,
      serviceId,
      startAt,
      isMobile,
      notes,
      intakeAnswers,
      affiliateCode,
    } = parsed.data;

    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider)
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId, active: true },
      include: { questions: true },
    });
    if (!service)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const start = parseStartAt(startAt);
    if (isNaN(start.getTime()))
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });

    // 1) First-time booking check (for affiliate eligibility)
    let affiliate: { id: string } | null = null;
    let isFirstBooking = false;

    const existingCustomer = await prisma.customer.findUnique({ where: { phone } });
    if (!existingCustomer) {
      isFirstBooking = true;
    } else {
      const previousBooking = await prisma.booking.findFirst({
        where: { customerId: existingCustomer.id, status: "COMPLETED" },
      });
      if (!previousBooking) isFirstBooking = true;
    }

    if (affiliateCode && isFirstBooking) {
      affiliate = await prisma.affiliate.findUnique({
        where: { code: affiliateCode.toUpperCase() },
        select: { id: true },
      });
    }

    // 2) Pricing
    const estimatedMiles = isMobile ? estimateMilesZip(provider.baseZip, customerZip) : 0;
    const travelFeeCents = isMobile ? estimatedMiles * provider.travelRateCents : 0;

    const baseServicePriceCents = service.priceCents;
    const subtotalCents = baseServicePriceCents + travelFeeCents;

    // Platform fee: 5% always
    const platformFeeCents = Math.round(baseServicePriceCents * 0.05);

    // Affiliate commission: 10% on first booking (if valid code)
    const affiliateCommissionCents = affiliate ? Math.round(baseServicePriceCents * 0.1) : 0;

    // Stripe processing fee (customer-visible): 3% on each charge we run.
    const depositBaseCents = Math.max(1, Math.round(subtotalCents * DEPOSIT_PCT));
    const depositStripeFeeCents = Math.round(depositBaseCents * 0.03);
    const depositTotalCents = depositBaseCents + depositStripeFeeCents;

    const remainingBaseCents = Math.max(0, subtotalCents - depositBaseCents);
    const remainingStripeFeeCents = Math.round(remainingBaseCents * 0.03);

    const totalStripeFeeCents = depositStripeFeeCents + remainingStripeFeeCents;
    const totalCents = subtotalCents + totalStripeFeeCents;

    const customer = await prisma.customer.upsert({
      where: { phone },
      update: { fullName },
      create: { fullName, phone },
    });

    const { randomBytes } = await import("crypto");
    const customerConfirmToken = randomBytes(16).toString("hex");
    const customerCancelToken = randomBytes(16).toString("hex");
    const customerIssueToken = randomBytes(16).toString("hex");

    // Create booking first so we can attach multiple payments.
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
        stripeFeeCents: totalStripeFeeCents,
        depositCents: depositTotalCents,
        travelFeeCents,
        totalCents,
        customerConfirmToken,
        customerCancelToken,
        customerIssueToken,
        affiliateId: affiliate?.id,
        affiliateCommissionCents,
        intakeAnswers: intakeAnswers
          ? {
              create: intakeAnswers.map((a) => ({
                questionId: a.questionId,
                text: a.text,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });

    // Deposit Payment record
    const depositPayment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        type: "DEPOSIT",
        status: "REQUIRES_PAYMENT",
        amountCents: depositTotalCents,
        currency: "USD",
        provider: "stripe",
      },
      select: { id: true },
    });

    const baseUrl = process.env.APP_BASE_URL || new URL(req.url).origin;

    // Allow a demo fallback when Stripe is not configured.
    if (!process.env.STRIPE_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          ok: true,
          bookingId: booking.id,
          checkoutUrl: `${baseUrl}/book/success?bookingId=${booking.id}&demo=1&cancelToken=${customerCancelToken}`,
        });
      }
      return NextResponse.json(
        { error: "Payments are not configured. Please try again later." },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    // For deposit-only: we are collecting the deposit today, and saving the card for the remainder.
    const connectPayoutEnabled = !!provider.stripeAccountId;

    // Note: destination charges are only applied for the deposit payment here.
    // For the remainder charge we will create a new PaymentIntent later.
    const checkoutParams = {
      mode: "payment",
      customer_creation: "if_required",
      success_url: `${baseUrl}/book/success?bookingId=${booking.id}&cancelToken=${customerCancelToken}&issueToken=${customerIssueToken}`,
      cancel_url: `${baseUrl}/book/cancel?bookingId=${booking.id}`,
      metadata: { bookingId: booking.id, paymentId: depositPayment.id, kind: "deposit" },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: depositBaseCents,
            product_data: {
              name: `${provider.displayName} — ${service.name} (Deposit 25%)`,
              description: isMobile
                ? `Deposit for mobile appointment (${estimatedMiles} mi est.)`
                : `Deposit for in-studio appointment`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: depositStripeFeeCents,
            product_data: {
              name: `Processing Fee`,
              description: `3% secure payment processing (deposit)`,
            },
          },
        },
      ],
      payment_intent_data: {
        // capture immediately; this is the deposit
        metadata: {
          bookingId: booking.id,
          providerId: provider.id,
          connectPayoutEnabled: String(connectPayoutEnabled),
          kind: "deposit",
        },
        // Save payment method for later off-session remainder charge.
        setup_future_usage: "off_session",
        ...(connectPayoutEnabled
          ? {
              // Deposit: platform takes proportional fee on deposit as well.
              // NOTE: platform fee model can be adjusted; keeping simple proportional allocation.
              application_fee_amount: Math.round(
                (platformFeeCents + affiliateCommissionCents) * DEPOSIT_PCT
              ),
              transfer_data: { destination: provider.stripeAccountId! },
            }
          : {}),
      },
    } as const;

    const session = await stripe.checkout.sessions.create(checkoutParams as any);

    await prisma.payment.update({
      where: { id: depositPayment.id },
      data: { paymentIntentId: session.payment_intent as string },
    });

    return NextResponse.json({ ok: true, bookingId: booking.id, checkoutUrl: session.url });
  } catch (e: any) {
    console.error("/api/bookings POST failed", e);
    return NextResponse.json({ error: e?.message || "Booking failed" }, { status: 500 });
  }
}
