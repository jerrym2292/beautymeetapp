-- Add active flag to Provider for admin hide/disable
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
