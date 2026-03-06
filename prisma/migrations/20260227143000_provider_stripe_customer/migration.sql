-- Add stripeCustomerId to Provider for subscription billing portal
ALTER TABLE "Provider" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "Provider_stripeCustomerId_key" ON "Provider"("stripeCustomerId");
