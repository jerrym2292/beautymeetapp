-- Add avatar/profile photo URL to Provider
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
