import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

// Full smoke test helper for STAGING.
// Creates an E2E provider/service/customer/booking (no Stripe call), then returns tokens/ids
// so the admin can click through dashboards and provider/customer actions.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const baseUrl = process.env.APP_BASE_URL || "";
  const isProd = baseUrl.includes("beautymeetapp.com") && !baseUrl.includes("127.0.0.1") && !baseUrl.includes("localhost");
  if (isProd) {
    return NextResponse.json({ error: "Smoke test is disabled on production." }, { status: 403 });
  }

  // 1) Ensure provider + service exist (same as /api/admin/e2e/seed)
  const E2E = {
    displayName: "E2E Test Provider",
    baseZip: "15001",
    baseCity: "Aliquippa",
    baseState: "PA",
    phone: "+155500015001",
    email: "e2e-provider@beautymeetapp.com",
  };

  const existingApp = await prisma.providerApplication.findFirst({
    where: { OR: [{ email: E2E.email }, { phone: E2E.phone }] },
  });

  const app =
    existingApp ||
    (await prisma.providerApplication.create({
      data: {
        fullName: "E2E Provider",
        phone: E2E.phone,
        email: E2E.email,
        address1: "1 E2E St",
        city: E2E.baseCity,
        state: E2E.baseState,
        zip: E2E.baseZip,
        status: "APPROVED",
        notes: "Created by /api/admin/testing/smoke",
      },
    }));

  let provider = await prisma.provider.findFirst({ where: { applicationId: app.id } });
  if (!provider) {
    provider = await prisma.provider.create({
      data: {
        applicationId: app.id,
        accessToken: crypto.randomUUID(),
        displayName: E2E.displayName,
        mode: "BOTH",
        baseAddress1: "TBD",
        baseAddress2: null,
        baseCity: E2E.baseCity,
        baseState: E2E.baseState,
        baseZip: E2E.baseZip,
        maxTravelMiles: 25,
        travelRateCents: 100,
      },
    });
  }

  const service =
    (await prisma.service.findFirst({ where: { providerId: provider.id, active: true } })) ||
    (await prisma.service.create({
      data: {
        providerId: provider.id,
        category: "LASHES_BROWS",
        name: "E2E Classic Full Set",
        durationMin: 120,
        priceCents: 12000,
        active: true,
      },
    }));

  // 2) Ensure a customer exists
  const customer = await prisma.customer.upsert({
    where: { phone: "+15550009999" },
    update: { fullName: "E2E Customer" },
    create: { fullName: "E2E Customer", phone: "+15550009999" },
  });

  // 3) Create a booking (no Stripe) + payment placeholder
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const confirmToken = crypto.randomUUID().replaceAll("-", "").slice(0, 32);
  const cancelToken = crypto.randomUUID().replaceAll("-", "").slice(0, 32);

  const booking = await prisma.booking.create({
    data: {
      providerId: provider.id,
      customerId: customer.id,
      serviceId: service.id,
      startAt,
      notes: "Created by /api/admin/testing/smoke",
      isMobile: false,
      customerZip: provider.baseZip,
      estimatedMiles: null,
      servicePriceCents: service.priceCents,
      platformFeeCents: 250,
      stripeFeeCents: 0,
      depositCents: Math.round(service.priceCents * 0.2),
      travelFeeCents: 0,
      totalCents: service.priceCents,
      customerConfirmToken: confirmToken,
      customerCancelToken: cancelToken,
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      status: "REQUIRES_PAYMENT",
      amountCents: booking.depositCents,
      currency: "USD",
      provider: "stripe",
      type: "DEPOSIT",
    },
  });

  return NextResponse.json({
    ok: true,
    provider: { id: provider.id, accessToken: provider.accessToken },
    service: { id: service.id, name: service.name },
    booking: { id: booking.id, startAt: booking.startAt.toISOString(), confirmToken, cancelToken },
    links: {
      techDashboard: `/tech/${provider.accessToken}`,
      providerProfile: `/p/${provider.id}`,
      customerConfirmApi: `/api/confirm/${confirmToken}`,
      customerCancelLink: `/book/success?bookingId=${booking.id}&cancelToken=${cancelToken}`,
      adminBookings: "/admin/bookings",
    },
  });
}
