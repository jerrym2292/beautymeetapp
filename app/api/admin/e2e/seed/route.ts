import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

// Idempotent seed action for end-to-end QA.
// Creates:
// - an E2E provider application + approved provider in ZIP 15001
// - at least 1 active service
//
// Safe to run multiple times.
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const E2E = {
    displayName: "E2E Test Provider",
    baseZip: "15001",
    baseCity: "Aliquippa",
    baseState: "PA",
    phone: "+155500015001",
    email: "e2e-provider@beautymeetapp.com",
  };

  // Find an existing provider by displayName or app email/phone.
  const existingApp = await prisma.providerApplication.findFirst({
    where: {
      OR: [{ email: E2E.email }, { phone: E2E.phone }],
    },
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
        notes: "Created by /api/admin/e2e/seed",
      },
    }));

  let provider = await prisma.provider.findFirst({
    where: { applicationId: app.id },
  });

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

  // Ensure at least one active service exists.
  const service = await prisma.service.findFirst({
    where: { providerId: provider.id, active: true },
  });

  const ensuredService =
    service ||
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

  return NextResponse.json({
    ok: true,
    provider: { id: provider.id, accessToken: provider.accessToken, baseZip: provider.baseZip },
    service: { id: ensuredService.id, name: ensuredService.name },
  });
}
