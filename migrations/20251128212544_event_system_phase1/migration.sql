-- CreateTable
CREATE TABLE "EventVolunteerRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventVolunteerRole_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDateTime" DATETIME NOT NULL,
    "endDateTime" DATETIME,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineUrl" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'MEMBERS_ONLY',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "capacityLimit" INTEGER,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "locationText" TEXT,
    "locationId" TEXT,
    "posterStorageKey" TEXT,
    "posterUrl" TEXT,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpenAt" DATETIME,
    "registrationCloseAt" DATETIME,
    "price" REAL,
    "url" TEXT,
    "organizerId" TEXT,
    "cancellationReason" TEXT,
    "tags" JSONB,
    "recurrenceGroupId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdByUserId", "deletedAt", "description", "endDateTime", "id", "isOnline", "locationText", "onlineUrl", "startDateTime", "tenantId", "title") SELECT "createdByUserId", "deletedAt", "description", "endDateTime", "id", "isOnline", "locationText", "onlineUrl", "startDateTime", "tenantId", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_EventRSVP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    "role" TEXT DEFAULT 'ATTENDEE',
    "notes" TEXT,
    "checkInTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventRSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventRSVP" ("createdAt", "eventId", "id", "status", "updatedAt", "userId") SELECT "createdAt", "eventId", "id", "status", "updatedAt", "userId" FROM "EventRSVP";
DROP TABLE "EventRSVP";
ALTER TABLE "new_EventRSVP" RENAME TO "EventRSVP";
CREATE UNIQUE INDEX "EventRSVP_userId_eventId_key" ON "EventRSVP"("userId", "eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EventVolunteerRole_eventId_idx" ON "EventVolunteerRole"("eventId");
