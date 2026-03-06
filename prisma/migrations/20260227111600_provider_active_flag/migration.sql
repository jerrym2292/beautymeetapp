-- Add active flag to Provider for admin hide/disable
ALTER TABLE "Provider" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
