-- Add provider availability JSON fields
ALTER TABLE "Provider" ADD COLUMN "availabilitySettingsJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "availabilityWindowsJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "availabilityTimeOffJson" TEXT;
