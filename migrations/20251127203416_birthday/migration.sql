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
    "enableTrips" BOOLEAN NOT NULL DEFAULT false,
    "enableLiveStream" BOOLEAN NOT NULL DEFAULT false,
    "enablePhotos" BOOLEAN NOT NULL DEFAULT true,
    "enablePrayerWall" BOOLEAN NOT NULL DEFAULT false,
    "autoApprovePrayerWall" BOOLEAN NOT NULL DEFAULT false,
    "enableResourceCenter" BOOLEAN NOT NULL DEFAULT false,
    "enableTripFundraising" BOOLEAN NOT NULL DEFAULT false,
    "tripCalendarColor" TEXT DEFAULT '#0EA5E9',
    "donationSettings" JSONB NOT NULL,
    "liveStreamSettings" JSONB NOT NULL,
    "visitorVisibility" JSONB NOT NULL,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 1000,
    "enableBirthdays" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TenantSettings" ("autoApprovePrayerWall", "donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePhotos", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableTripFundraising", "enableTrips", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", "tenantId", "tripCalendarColor", "visitorVisibility") SELECT "autoApprovePrayerWall", "donationSettings", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePhotos", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableTripFundraising", "enableTrips", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", "tenantId", "tripCalendarColor", "visitorVisibility" FROM "TenantSettings";
DROP TABLE "TenantSettings";
ALTER TABLE "new_TenantSettings" RENAME TO "TenantSettings";
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "languages" TEXT,
    "birthDate" DATETIME,
    "isBirthdayPublic" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserProfile" ("avatarUrl", "bio", "displayName", "id", "languages", "locationCity", "locationCountry", "userId") SELECT "avatarUrl", "bio", "displayName", "id", "languages", "locationCity", "locationCountry", "userId" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
