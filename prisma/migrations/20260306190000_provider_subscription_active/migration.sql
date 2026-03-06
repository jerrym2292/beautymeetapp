-- Add subscriptionActive flag to Provider
ALTER TABLE "Provider" ADD COLUMN "subscriptionActive" BOOLEAN NOT NULL DEFAULT false;
