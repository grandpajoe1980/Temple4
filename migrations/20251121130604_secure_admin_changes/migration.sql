-- CreateTable
CREATE TABLE "EmailProviderConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "type" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "runAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" DATETIME,
    "processedAt" DATETIME,
    "provider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TenantSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "membershipApprovalMode" TEXT NOT NULL DEFAULT 'APPROVAL_REQUIRED',
    "enableCalendar" BOOLEAN NOT NULL DEFAULT true,
    "enablePosts" BOOLEAN NOT NULL DEFAULT true,
    "enableSermons" BOOLEAN NOT NULL DEFAULT true,
    "enablePodcasts" BOOLEAN NOT NULL DEFAULT true,
    "enableBooks" BOOLEAN NOT NULL DEFAULT true,
    "enableMemberDirectory" BOOLEAN NOT NULL DEFAULT true,
    "enableGroupChat" BOOLEAN NOT NULL DEFAULT true,
    "enableComments" BOOLEAN NOT NULL DEFAULT true,
    "enableReactions" BOOLEAN NOT NULL DEFAULT true,
    "enableServices" BOOLEAN NOT NULL DEFAULT true,
    "enableDonations" BOOLEAN NOT NULL DEFAULT false,
    "enableVolunteering" BOOLEAN NOT NULL DEFAULT false,
    "enableSmallGroups" BOOLEAN NOT NULL DEFAULT false,
    "enableLiveStream" BOOLEAN NOT NULL DEFAULT false,
    "enablePhotos" BOOLEAN NOT NULL DEFAULT true,
    "enablePrayerWall" BOOLEAN NOT NULL DEFAULT false,
    "autoApprovePrayerWall" BOOLEAN NOT NULL DEFAULT false,
    "enableResourceCenter" BOOLEAN NOT NULL DEFAULT false,
    "donationSettings" JSONB NOT NULL,
    "liveStreamSettings" JSONB NOT NULL,
    "visitorVisibility" JSONB NOT NULL,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 1000,
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TenantSettings" ("autoApprovePrayerWall", "donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", "tenantId", "visitorVisibility") SELECT "autoApprovePrayerWall", "donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", "tenantId", "visitorVisibility" FROM "TenantSettings";
DROP TABLE "TenantSettings";
ALTER TABLE "new_TenantSettings" RENAME TO "TenantSettings";
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Outbox_status_runAt_idx" ON "Outbox"("status", "runAt");
