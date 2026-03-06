/*
  Warnings:

  - Added the required column `stripeFeeCents` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProviderApplication" ADD COLUMN "appliedCategoriesJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "categoryLicensesJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "dob" DATETIME;
ALTER TABLE "ProviderApplication" ADD COLUMN "idUrl" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "legalNameOnLicense" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseState" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "licenseUrl" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationDetailsJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationSourceJson" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verificationStatus" TEXT;
ALTER TABLE "ProviderApplication" ADD COLUMN "verifiedAt" DATETIME;

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "WaitlistEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntakeQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    CONSTRAINT "IntakeQuestion_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntakeAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "IntakeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "IntakeQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IntakeAnswer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "balanceCents" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "notes" TEXT,
    "isMobile" BOOLEAN NOT NULL DEFAULT false,
    "customerZip" TEXT NOT NULL,
    "estimatedMiles" INTEGER,
    "servicePriceCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "stripeFeeCents" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "travelFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "affiliateId" TEXT,
    "affiliateCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "providerConfirmedAt" DATETIME,
    "customerConfirmedAt" DATETIME,
    "completedAt" DATETIME,
    "customerConfirmToken" TEXT,
    "customerCancelToken" TEXT,
    "paymentId" TEXT,
    CONSTRAINT "Booking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("completedAt", "createdAt", "customerCancelToken", "customerConfirmToken", "customerConfirmedAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "paymentId", "platformFeeCents", "providerConfirmedAt", "providerId", "serviceId", "servicePriceCents", "startAt", "status", "totalCents", "travelFeeCents", "updatedAt") SELECT "completedAt", "createdAt", "customerCancelToken", "customerConfirmToken", "customerConfirmedAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "paymentId", "platformFeeCents", "providerConfirmedAt", "providerId", "serviceId", "servicePriceCents", "startAt", "status", "totalCents", "travelFeeCents", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_customerConfirmToken_key" ON "Booking"("customerConfirmToken");
CREATE UNIQUE INDEX "Booking_customerCancelToken_key" ON "Booking"("customerCancelToken");
CREATE UNIQUE INDEX "Booking_paymentId_key" ON "Booking"("paymentId");
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "applicationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "instagram" TEXT,
    "mode" TEXT NOT NULL,
    "baseAddress1" TEXT NOT NULL,
    "baseAddress2" TEXT,
    "baseCity" TEXT NOT NULL,
    "baseState" TEXT NOT NULL,
    "baseZip" TEXT NOT NULL,
    "travelZonesJson" TEXT,
    "travelZoneSurchargesJson" TEXT,
    "portfolioUrlsJson" TEXT,
    "kitEquipmentJson" TEXT,
    "rebookingSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxTravelMiles" INTEGER,
    "travelRateCents" INTEGER NOT NULL DEFAULT 100,
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "stripeAccountId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "referredById" TEXT,
    "referralPaid" BOOLEAN NOT NULL DEFAULT false,
    "availabilitySettingsJson" TEXT,
    "availabilityWindowsJson" TEXT,
    "availabilityTimeOffJson" TEXT,
    CONSTRAINT "Provider_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Affiliate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Provider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProviderApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "stripeAccountId", "stripeChargesEnabled", "stripePayoutsEnabled", "travelRateCents", "updatedAt") SELECT "accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "stripeAccountId", "stripeChargesEnabled", "stripePayoutsEnabled", "travelRateCents", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_applicationId_key" ON "Provider"("applicationId");
CREATE UNIQUE INDEX "Provider_accessToken_key" ON "Provider"("accessToken");
CREATE UNIQUE INDEX "Provider_stripeSubscriptionId_key" ON "Provider"("stripeSubscriptionId");
CREATE UNIQUE INDEX "Provider_stripeAccountId_key" ON "Provider"("stripeAccountId");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "providerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "prepInstructions" TEXT,
    "rebookingWeeks" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("active", "category", "createdAt", "durationMin", "id", "name", "priceCents", "providerId", "updatedAt") SELECT "active", "category", "createdAt", "durationMin", "id", "name", "priceCents", "providerId", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "providerId" TEXT,
    "affiliateId" TEXT,
    CONSTRAINT "User_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash", "providerId", "role", "updatedAt") SELECT "createdAt", "email", "id", "passwordHash", "providerId", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");
CREATE UNIQUE INDEX "User_affiliateId_key" ON "User"("affiliateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");
