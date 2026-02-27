-- Add social links to Provider
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
