import { execSync } from 'node:child_process';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function globalSetup() {
  // Prefer seeding via HTTP so E2E does not depend on local Prisma provider.
  // This works for both localhost (Playwright webServer) and remote environments.
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';
  const adminPin = process.env.ADMIN_PIN;

  if (adminPin) {
    // Wait briefly for the server to be up
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${baseURL.replace(/\/$/, '')}/api/admin/e2e/seed`, {
          headers: { 'x-admin-pin': adminPin },
        });
        if (res.ok) {
          // seeded
          return;
        }
      } catch {}
      await sleep(1000);
    }
    // fallthrough
  }

  // Fallback: try Prisma seeding (mainly for fully-local dev).
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    execSync('E2E_SEED=1 node prisma/seed.js', { stdio: 'inherit' });
  } catch (e) {
    // Don't hard-fail global setup; tests that rely on seed will fail with clearer errors.
    console.warn('globalSetup: seeding failed (no ADMIN_PIN and Prisma seed failed).', e);
  }
}
