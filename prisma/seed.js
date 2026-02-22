/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 1) Optional admin bootstrap
  const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "jerrym2292@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log(`Created ADMIN user: ${adminEmail}`);
    }
  } else {
    console.log("ADMIN_BOOTSTRAP_PASSWORD not set; skipping admin user creation.");
  }

  // 2) E2E seed (safe to run repeatedly)
  // Used by Playwright tests to ensure at least one searchable provider + service exists.
  const doE2E = process.env.E2E_SEED === '1' || process.env.NODE_ENV === 'test';
  if (doE2E) {
    const application = await prisma.providerApplication.upsert({
      where: { id: 'e2e-app' },
      update: {
        fullName: 'E2E Test Provider',
        phone: '5550000000',
        email: 'e2e-provider@example.com',
        city: 'E2E City',
        state: 'PA',
        zip: '15001',
        status: 'APPROVED',
      },
      create: {
        id: 'e2e-app',
        fullName: 'E2E Test Provider',
        phone: '5550000000',
        email: 'e2e-provider@example.com',
        city: 'E2E City',
        state: 'PA',
        zip: '15001',
        status: 'APPROVED',
      },
    });

    const provider = await prisma.provider.upsert({
      where: { accessToken: 'e2e-provider-token' },
      update: {
        displayName: 'E2E Test Provider',
        mode: 'BOTH',
        baseAddress1: '1 E2E Street',
        baseCity: 'E2E City',
        baseState: 'PA',
        baseZip: '15001',
        maxTravelMiles: 25,
        travelRateCents: 100,
        applicationId: application.id,
        // Keep Stripe Connect fields empty for deterministic tests
        stripeAccountId: null,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      },
      create: {
        applicationId: application.id,
        accessToken: 'e2e-provider-token',
        displayName: 'E2E Test Provider',
        mode: 'BOTH',
        baseAddress1: '1 E2E Street',
        baseCity: 'E2E City',
        baseState: 'PA',
        baseZip: '15001',
        maxTravelMiles: 25,
        travelRateCents: 100,
      },
    });

    await prisma.service.upsert({
      where: { id: 'e2e-service' },
      update: {
        providerId: provider.id,
        category: 'LASHES_BROWS',
        name: 'E2E Classic Full Set',
        durationMin: 120,
        priceCents: 12000,
        active: true,
      },
      create: {
        id: 'e2e-service',
        providerId: provider.id,
        category: 'LASHES_BROWS',
        name: 'E2E Classic Full Set',
        durationMin: 120,
        priceCents: 12000,
        active: true,
      },
    });

    console.log('Seeded E2E provider + service');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
