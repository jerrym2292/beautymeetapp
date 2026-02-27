-- Add stripeCustomerId to Provider for subscription billing portal
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_stripeCustomerId_key" ON "Provider"("stripeCustomerId");
