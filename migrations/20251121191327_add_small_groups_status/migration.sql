-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "archivedAt" DATETIME,
    CONSTRAINT "SmallGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SmallGroup" ("description", "id", "isActive", "isPublic", "leaderUserId", "meetingSchedule", "name", "tenantId") SELECT "description", "id", "isActive", "isPublic", "leaderUserId", "meetingSchedule", "name", "tenantId" FROM "SmallGroup";
DROP TABLE "SmallGroup";
ALTER TABLE "new_SmallGroup" RENAME TO "SmallGroup";
CREATE UNIQUE INDEX "SmallGroup_slug_key" ON "SmallGroup"("slug");
CREATE TABLE "new_SmallGroupMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "addedByUserId" TEXT,
    CONSTRAINT "SmallGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SmallGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SmallGroupMembership" ("groupId", "id", "joinedAt", "role", "userId") SELECT "groupId", "id", "joinedAt", "role", "userId" FROM "SmallGroupMembership";
DROP TABLE "SmallGroupMembership";
ALTER TABLE "new_SmallGroupMembership" RENAME TO "SmallGroupMembership";
CREATE UNIQUE INDEX "SmallGroupMembership_groupId_userId_key" ON "SmallGroupMembership"("groupId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
