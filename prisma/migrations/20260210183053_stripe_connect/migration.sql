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
    "depositCents" INTEGER NOT NULL,
    "travelFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "providerConfirmedAt" DATETIME,
    "customerConfirmedAt" DATETIME,
    "completedAt" DATETIME,
    "customerConfirmToken" TEXT,
    "paymentId" TEXT,
    CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "paymentId", "platformFeeCents", "providerId", "serviceId", "servicePriceCents", "startAt", "status", "travelFeeCents", "updatedAt") SELECT "createdAt", "customerId", "customerZip", "depositCents", "estimatedMiles", "id", "isMobile", "notes", "paymentId", "platformFeeCents", "providerId", "serviceId", "servicePriceCents", "startAt", "status", "travelFeeCents", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_customerConfirmToken_key" ON "Booking"("customerConfirmToken");
CREATE UNIQUE INDEX "Booking_paymentId_key" ON "Booking"("paymentId");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "paymentIntentId" TEXT,
    "latestChargeId" TEXT
);
INSERT INTO "new_Payment" ("amountCents", "createdAt", "currency", "id", "provider", "status", "updatedAt") SELECT "amountCents", "createdAt", "currency", "id", "provider", "status", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
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
    "maxTravelMiles" INTEGER,
    "travelRateCents" INTEGER NOT NULL DEFAULT 100,
    "stripeAccountId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Provider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProviderApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "travelRateCents", "updatedAt") SELECT "accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "travelRateCents", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_applicationId_key" ON "Provider"("applicationId");
CREATE UNIQUE INDEX "Provider_accessToken_key" ON "Provider"("accessToken");
CREATE UNIQUE INDEX "Provider_stripeAccountId_key" ON "Provider"("stripeAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

