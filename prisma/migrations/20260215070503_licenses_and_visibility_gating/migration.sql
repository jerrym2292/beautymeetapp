-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "licenseType" TEXT,
    "licenseState" TEXT,
    "licenseNumber" TEXT,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "membershipStatus" TEXT,
    "membershipStripeCustomerId" TEXT,
    "membershipStripeSubscriptionId" TEXT,
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
INSERT INTO "new_Provider" ("accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "stripeAccountId", "stripeChargesEnabled", "stripePayoutsEnabled", "travelRateCents", "updatedAt") SELECT "accessToken", "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "stripeAccountId", "stripeChargesEnabled", "stripePayoutsEnabled", "travelRateCents", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_applicationId_key" ON "Provider"("applicationId");
CREATE UNIQUE INDEX "Provider_accessToken_key" ON "Provider"("accessToken");
CREATE UNIQUE INDEX "Provider_stripeAccountId_key" ON "Provider"("stripeAccountId");
CREATE TABLE "new_ProviderApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "licenseType" TEXT,
    "licenseState" TEXT,
    "licenseNumber" TEXT,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT
);
INSERT INTO "new_ProviderApplication" ("address1", "address2", "city", "createdAt", "email", "fullName", "id", "notes", "phone", "state", "status", "updatedAt", "zip") SELECT "address1", "address2", "city", "createdAt", "email", "fullName", "id", "notes", "phone", "state", "status", "updatedAt", "zip" FROM "ProviderApplication";
DROP TABLE "ProviderApplication";
ALTER TABLE "new_ProviderApplication" RENAME TO "ProviderApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
