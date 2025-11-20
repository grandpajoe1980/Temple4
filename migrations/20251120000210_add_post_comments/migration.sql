/*
  Warnings:

  - You are about to alter the column `bookingRules` on the `Facility` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- CreateTable
CREATE TABLE "FacilityBlackout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "reason" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacilityBlackout_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bookingRules" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Facility" ("bookingRules", "capacity", "createdAt", "description", "id", "isActive", "location", "name", "tenantId", "type", "updatedAt") SELECT "bookingRules", "capacity", "createdAt", "description", "id", "isActive", "location", "name", "tenantId", "type", "updatedAt" FROM "Facility";
DROP TABLE "Facility";
ALTER TABLE "new_Facility" RENAME TO "Facility";
CREATE INDEX "Facility_tenantId_isActive_idx" ON "Facility"("tenantId", "isActive");
CREATE TABLE "new_FacilityBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "eventId" TEXT,
    "requestedById" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacilityBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacilityBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FacilityBooking_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacilityBooking" ("createdAt", "endAt", "eventId", "facilityId", "id", "notes", "purpose", "requestedById", "startAt", "status", "tenantId") SELECT "createdAt", "endAt", "eventId", "facilityId", "id", "notes", "purpose", "requestedById", "startAt", "status", "tenantId" FROM "FacilityBooking";
DROP TABLE "FacilityBooking";
ALTER TABLE "new_FacilityBooking" RENAME TO "FacilityBooking";
CREATE INDEX "FacilityBooking_tenantId_facilityId_startAt_endAt_idx" ON "FacilityBooking"("tenantId", "facilityId", "startAt", "endAt");
CREATE INDEX "FacilityBooking_requestedById_idx" ON "FacilityBooking"("requestedById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FacilityBlackout_tenantId_facilityId_startAt_endAt_idx" ON "FacilityBlackout"("tenantId", "facilityId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostComment_tenantId_createdAt_idx" ON "PostComment"("tenantId", "createdAt");
