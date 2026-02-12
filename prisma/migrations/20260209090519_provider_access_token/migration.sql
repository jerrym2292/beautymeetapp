/*
  Warnings:

  - Added the required column `accessToken` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Provider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProviderApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "travelRateCents", "updatedAt") SELECT "applicationId", "baseAddress1", "baseAddress2", "baseCity", "baseState", "baseZip", "bio", "createdAt", "displayName", "id", "instagram", "maxTravelMiles", "mode", "travelRateCents", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_applicationId_key" ON "Provider"("applicationId");
CREATE UNIQUE INDEX "Provider_accessToken_key" ON "Provider"("accessToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
