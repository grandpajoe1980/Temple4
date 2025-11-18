-- AlterTable
ALTER TABLE "ResourceItem" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "ResourceItem" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "ResourceItem" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "ResourceItem" ADD COLUMN "uploadedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaItem_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MediaItem" ("authorUserId", "deletedAt", "description", "embedUrl", "id", "publishedAt", "tenantId", "title", "type") SELECT "authorUserId", "deletedAt", "description", "embedUrl", "id", "publishedAt", "tenantId", "title", "type" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
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
    "enableDonations" BOOLEAN NOT NULL DEFAULT false,
    "enableVolunteering" BOOLEAN NOT NULL DEFAULT false,
    "enableSmallGroups" BOOLEAN NOT NULL DEFAULT false,
    "enableLiveStream" BOOLEAN NOT NULL DEFAULT false,
    "enablePrayerWall" BOOLEAN NOT NULL DEFAULT false,
    "enableResourceCenter" BOOLEAN NOT NULL DEFAULT false,
    "donationSettings" JSONB NOT NULL,
    "liveStreamSettings" JSONB NOT NULL,
    "visitorVisibility" JSONB NOT NULL,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 1000,
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TenantSettings" ("donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableSmallGroups", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "membershipApprovalMode", "tenantId", "visitorVisibility") SELECT "donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableSmallGroups", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "membershipApprovalMode", "tenantId", "visitorVisibility" FROM "TenantSettings";
DROP TABLE "TenantSettings";
ALTER TABLE "new_TenantSettings" RENAME TO "TenantSettings";
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
