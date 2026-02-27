-- Add missing fields to ProviderApplication (production hotfix)
ALTER TABLE "ProviderApplication" ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3);
ALTER TABLE "ProviderApplication" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN IF NOT EXISTS "licenseState" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN IF NOT EXISTS "licenseUrl" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN IF NOT EXISTS "idUrl" TEXT;
