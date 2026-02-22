import { execSync } from 'node:child_process';

export default async function globalSetup() {
  // Ensure schema is applied + deterministic E2E data exists.
  execSync('npx prisma db push', { stdio: 'inherit' });
  execSync('E2E_SEED=1 node prisma/seed.js', { stdio: 'inherit' });
}
