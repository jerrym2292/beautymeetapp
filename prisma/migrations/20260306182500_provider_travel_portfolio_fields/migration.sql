-- Add Provider travel/portfolio fields used by APIs
ALTER TABLE "Provider" ADD COLUMN "travelZonesJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "travelZoneSurchargesJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "portfolioUrlsJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "kitEquipmentJson" TEXT;
ALTER TABLE "Provider" ADD COLUMN "rebookingSmsEnabled" BOOLEAN NOT NULL DEFAULT true;
