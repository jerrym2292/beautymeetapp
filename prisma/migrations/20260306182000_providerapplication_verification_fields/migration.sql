-- Add ProviderApplication verification + multi-category fields
ALTER TABLE "ProviderApplication" ADD COLUMN "legalNameOnLicense" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "appliedCategoriesJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "categoryLicensesJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationStatus" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationDetailsJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationSourceJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verifiedAt" DATETIME;
