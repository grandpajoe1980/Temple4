-- CreateTable
CREATE TABLE "SmallGroupResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmallGroupResource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SmallGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupResource_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmallGroupAnnouncement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmallGroupAnnouncement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupAnnouncement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SmallGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupAnnouncement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "linkUrl" TEXT,
    "linkTitle" TEXT,
    "linkImage" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "ProfilePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePostMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfilePostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePostReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfilePostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilePostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePostComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "ProfilePostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilePostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Facility" ("bookingRules", "capacity", "createdAt", "description", "id", "imageUrl", "isActive", "location", "name", "tenantId", "type", "updatedAt") SELECT "bookingRules", "capacity", "createdAt", "description", "id", "imageUrl", "isActive", "location", "name", "tenantId", "type", "updatedAt" FROM "Facility";
DROP TABLE "Facility";
ALTER TABLE "new_Facility" RENAME TO "Facility";
CREATE INDEX "Facility_tenantId_isActive_idx" ON "Facility"("tenantId", "isActive");
CREATE TABLE "new_SmallGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "category" TEXT,
    "imageUrl" TEXT,
    "dayOfWeek" TEXT,
    "startTime" TEXT,
    "frequency" TEXT,
    "format" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "onlineMeetingLink" TEXT,
    "leaderUserId" TEXT,
    "meetingSchedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "joinPolicy" TEXT NOT NULL DEFAULT 'APPROVAL',
    "capacity" INTEGER,
    "ageFocus" TEXT,
    "language" TEXT,
    "hasChildcare" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "archivedAt" DATETIME,
    CONSTRAINT "SmallGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SmallGroup" ("ageFocus", "archivedAt", "capacity", "category", "createdAt", "createdByUserId", "dayOfWeek", "description", "format", "frequency", "hasChildcare", "id", "imageUrl", "isActive", "isPublic", "joinPolicy", "language", "leaderUserId", "locationAddress", "locationName", "meetingSchedule", "name", "onlineMeetingLink", "slug", "startTime", "status", "tags", "tenantId", "updatedAt") SELECT "ageFocus", "archivedAt", "capacity", "category", "createdAt", "createdByUserId", "dayOfWeek", "description", "format", "frequency", "hasChildcare", "id", "imageUrl", "isActive", "isPublic", "joinPolicy", "language", "leaderUserId", "locationAddress", "locationName", "meetingSchedule", "name", "onlineMeetingLink", "slug", "startTime", "status", "tags", "tenantId", "updatedAt" FROM "SmallGroup";
DROP TABLE "SmallGroup";
ALTER TABLE "new_SmallGroup" RENAME TO "SmallGroup";
CREATE UNIQUE INDEX "SmallGroup_slug_key" ON "SmallGroup"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProfilePost_userId_createdAt_idx" ON "ProfilePost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfilePost_userId_privacy_createdAt_idx" ON "ProfilePost"("userId", "privacy", "createdAt");

-- CreateIndex
CREATE INDEX "ProfilePostMedia_postId_order_idx" ON "ProfilePostMedia"("postId", "order");

-- CreateIndex
CREATE INDEX "ProfilePostReaction_postId_idx" ON "ProfilePostReaction"("postId");

-- CreateIndex
CREATE INDEX "ProfilePostReaction_userId_idx" ON "ProfilePostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePostReaction_postId_userId_key" ON "ProfilePostReaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "ProfilePostComment_postId_createdAt_idx" ON "ProfilePostComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfilePostComment_userId_idx" ON "ProfilePostComment"("userId");
