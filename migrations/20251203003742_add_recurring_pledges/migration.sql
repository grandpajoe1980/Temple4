/*
  Warnings:

  - You are about to alter the column `newMemberAlertChannels` on the `TenantSettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `alertChannels` on the `UserTenantMembership` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `fundId` to the `DonationRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "goalAmountCents" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "minAmountCents" INTEGER,
    "maxAmountCents" INTEGER,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" DATETIME,
    "campaignMetadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "nextChargeAt" DATETIME NOT NULL,
    "paymentMethodToken" TEXT,
    "paymentMethodLast4" TEXT,
    "paymentMethodBrand" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "totalChargesCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "lastChargedAt" DATETIME,
    "lastFailedAt" DATETIME,
    "lastFailureReason" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "dedicationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    "pausedAt" DATETIME,
    CONSTRAINT "Pledge_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PledgeCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pledgeId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "chargedAt" DATETIME,
    "failedAt" DATETIME,
    "failureReason" TEXT,
    "transactionId" TEXT,
    "receiptSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PledgeCharge_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "Pledge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PledgeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "maxFailuresBeforePause" INTEGER NOT NULL DEFAULT 3,
    "retryIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "dunningEmailDays" JSONB NOT NULL DEFAULT '[3, 7, 14]',
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "autoResumeOnSuccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DonationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "donatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnonymousOnLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "designationNote" TEXT,
    "campaignMetadata" JSONB,
    "paymentBrand" TEXT,
    "paymentLast4" TEXT,
    CONSTRAINT "DonationRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DonationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationRecord_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DonationRecord" ("amount", "currency", "displayName", "donatedAt", "id", "isAnonymousOnLeaderboard", "message", "tenantId", "userId") SELECT "amount", "currency", "displayName", "donatedAt", "id", "isAnonymousOnLeaderboard", "message", "tenantId", "userId" FROM "DonationRecord";
DROP TABLE "DonationRecord";
ALTER TABLE "new_DonationRecord" RENAME TO "DonationRecord";
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
    "enableRecurringPledges" BOOLEAN NOT NULL DEFAULT false,
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
    "enableEvents" BOOLEAN NOT NULL DEFAULT true,
    "donationSettings" JSONB NOT NULL,
    "liveStreamSettings" JSONB NOT NULL,
    "visitorVisibility" JSONB NOT NULL,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 1000,
    "enableBirthdays" BOOLEAN NOT NULL DEFAULT false,
    "welcomePacketUrl" TEXT,
    "welcomePacketVersion" INTEGER DEFAULT 1,
    "newMemberAlertChannels" JSONB NOT NULL DEFAULT '["email"]',
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TenantSettings" ("autoApprovePrayerWall", "donationSettings", "enableBirthdays", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableEvents", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePhotos", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableTripFundraising", "enableTrips", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", "newMemberAlertChannels", "tenantId", "tripCalendarColor", "visitorVisibility", "welcomePacketUrl", "welcomePacketVersion") SELECT "autoApprovePrayerWall", "donationSettings", "enableBirthdays", "enableBooks", "enableCalendar", "enableComments", "enableDonations", "enableEvents", "enableGroupChat", "enableLiveStream", "enableMemberDirectory", "enablePhotos", "enablePodcasts", "enablePosts", "enablePrayerWall", "enableReactions", "enableResourceCenter", "enableSermons", "enableServices", "enableSmallGroups", "enableTripFundraising", "enableTrips", "enableVolunteering", "id", "isPublic", "liveStreamSettings", "maxStorageMB", "membershipApprovalMode", coalesce("newMemberAlertChannels", '["email"]') AS "newMemberAlertChannels", "tenantId", "tripCalendarColor", "visitorVisibility", "welcomePacketUrl", "welcomePacketVersion" FROM "TenantSettings";
DROP TABLE "TenantSettings";
ALTER TABLE "new_TenantSettings" RENAME TO "TenantSettings";
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");
CREATE TABLE "new_UserTenantMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "displayName" TEXT,
    "welcomePacketUrl" TEXT,
    "welcomePacketVersion" INTEGER,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "alertSentAt" DATETIME,
    "alertChannels" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "UserTenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserTenantMembership" ("alertChannels", "alertSentAt", "displayName", "id", "onboardingStatus", "status", "tenantId", "userId", "welcomePacketUrl", "welcomePacketVersion") SELECT coalesce("alertChannels", '[]') AS "alertChannels", "alertSentAt", "displayName", "id", "onboardingStatus", "status", "tenantId", "userId", "welcomePacketUrl", "welcomePacketVersion" FROM "UserTenantMembership";
DROP TABLE "UserTenantMembership";
ALTER TABLE "new_UserTenantMembership" RENAME TO "UserTenantMembership";
CREATE UNIQUE INDEX "UserTenantMembership_userId_tenantId_key" ON "UserTenantMembership"("userId", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Fund_tenantId_visibility_archivedAt_idx" ON "Fund"("tenantId", "visibility", "archivedAt");

-- CreateIndex
CREATE INDEX "Pledge_tenantId_status_idx" ON "Pledge"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Pledge_userId_idx" ON "Pledge"("userId");

-- CreateIndex
CREATE INDEX "Pledge_nextChargeAt_status_idx" ON "Pledge"("nextChargeAt", "status");

-- CreateIndex
CREATE INDEX "PledgeCharge_pledgeId_createdAt_idx" ON "PledgeCharge"("pledgeId", "createdAt");

-- CreateIndex
CREATE INDEX "PledgeCharge_status_idx" ON "PledgeCharge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PledgeSettings_tenantId_key" ON "PledgeSettings"("tenantId");
