-- Add missing fields to ProviderApplication (production hotfix)
ALTER TABLE "ProviderApplication" ADD COLUMN "dob" DATETIME;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseState" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseUrl" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "idUrl" TEXT;
