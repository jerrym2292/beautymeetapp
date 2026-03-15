/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `stripeFeeCents` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "WaitlistEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT,
    CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "PortfolioImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    CONSTRAINT "PortfolioImage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "customerAddress1" TEXT,
    "customerAddress2" TEXT,
    "customerCity" TEXT,
    "customerState" TEXT,
    "customerZip" TEXT NOT NULL,
    "estimatedMiles" INTEGER,
    "servicePriceCents" INTEGER NOT NULL,
    "discountPctApplied" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "platformFeeCents" INTEGER NOT NULL,
    "stripeFeeCents" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "travelFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "affiliateId" TEXT,
    "affiliateCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "providerConfirmedAt" DATETIME,
    "customerConfirmedAt" DATETIME,
    "autoChargeAt" DATETIME,
    "issueReportedAt" DATETIME,
    "completedAt" DATETIME,
    "reviewRequestedAt" DATETIME,
    "customerConfirmToken" TEXT,
    "customerCancelToken" TEXT,
    "customerIssueToken" TEXT,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    CONSTRAINT "Booking_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("completedAt", "createdAt", "customerCancelToken", "customerConfirmToken", "customerConfirmedAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "platformFeeCents", "providerConfirmedAt", "providerId", "reviewRequestedAt", "serviceId", "servicePriceCents", "startAt", "status", "totalCents", "travelFeeCents", "updatedAt") SELECT "completedAt", "createdAt", "customerCancelToken", "customerConfirmToken", "customerConfirmedAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "platformFeeCents", "providerConfirmedAt", "providerId", "reviewRequestedAt", "serviceId", "servicePriceCents", "startAt", "status", "totalCents", "travelFeeCents", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_customerConfirmToken_key" ON "Booking"("customerConfirmToken");
CREATE UNIQUE INDEX "Booking_customerCancelToken_key" ON "Booking"("customerCancelToken");
CREATE UNIQUE INDEX "Booking_customerIssueToken_key" ON "Booking"("customerIssueToken");
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "referralCode" TEXT NOT NULL DEFAULT 'LEGACY',
    "referredByCustomerId" TEXT,
    "referralRewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "nextBookingDiscountPct" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Customer_referredByCustomerId_fkey" FOREIGN KEY ("referredByCustomerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("createdAt", "email", "fullName", "id", "phone", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "phone", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "type" TEXT NOT NULL DEFAULT 'DEPOSIT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "paymentIntentId" TEXT,
    "latestChargeId" TEXT,
    "receiptSmsSentAt" DATETIME,
    "bookingId" TEXT NOT NULL DEFAULT 'LEGACY',
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amountCents", "createdAt", "currency", "id", "latestChargeId", "paymentIntentId", "provider", "receiptSmsSentAt", "status", "updatedAt") SELECT "amountCents", "createdAt", "currency", "id", "latestChargeId", "paymentIntentId", "provider", "receiptSmsSentAt", "status", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX "Payment_paymentIntentId_idx" ON "Payment"("paymentIntentId");
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "applicationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
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
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeAccountId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "referredById" TEXT,
    "referralPaid" BOOLEAN NOT NULL DEFAULT false,
    "availabilitySettingsJson" TEXT,
    "availabilityWindowsJson" TEXT,
    "availabilityTimeOffJson" TEXT,
    CONSTRAINT "Provider_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Affiliate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Provider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProviderApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("accessToken", "active", "applicationId", "availabilitySettingsJson", "availabilityTimeOffJson", "availabilityWindowsJson", "avatarUrl", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "facebook", "id", "instagram", "kitEquipmentJson", "maxTravelMiles", "mode", "portfolioUrlsJson", "rebookingSmsEnabled", "stripeAccountId", "stripeChargesEnabled", "stripeCustomerId", "stripePayoutsEnabled", "subscriptionActive", "tiktok", "travelRateCents", "travelZoneSurchargesJson", "travelZonesJson", "updatedAt") SELECT "accessToken", "active", "applicationId", "availabilitySettingsJson", "availabilityTimeOffJson", "availabilityWindowsJson", "avatarUrl", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "facebook", "id", "instagram", "kitEquipmentJson", "maxTravelMiles", "mode", "portfolioUrlsJson", "rebookingSmsEnabled", "stripeAccountId", "stripeChargesEnabled", "stripeCustomerId", "stripePayoutsEnabled", "subscriptionActive", "tiktok", "travelRateCents", "travelZoneSurchargesJson", "travelZonesJson", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_applicationId_key" ON "Provider"("applicationId");
CREATE UNIQUE INDEX "Provider_accessToken_key" ON "Provider"("accessToken");
CREATE UNIQUE INDEX "Provider_stripeCustomerId_key" ON "Provider"("stripeCustomerId");
CREATE UNIQUE INDEX "Provider_stripeSubscriptionId_key" ON "Provider"("stripeSubscriptionId");
CREATE UNIQUE INDEX "Provider_stripeAccountId_key" ON "Provider"("stripeAccountId");
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
CREATE INDEX "WaitlistEntry_providerId_idx" ON "WaitlistEntry"("providerId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_customerId_idx" ON "WaitlistEntry"("customerId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_serviceId_idx" ON "WaitlistEntry"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");
