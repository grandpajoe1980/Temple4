-- Migration: add_small_groups_sql
-- This migration creates the SmallGroup and SmallGroupMembership tables if they do not already exist.
-- It is intentionally written using IF NOT EXISTS so it is safe to run against a database
-- that may already have these tables from a prior `prisma db push` during development.

PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "SmallGroup" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "slug" TEXT UNIQUE,
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
  "status" TEXT DEFAULT 'OPEN',
  "joinPolicy" TEXT DEFAULT 'APPROVAL',
  "capacity" INTEGER,
  "ageFocus" TEXT,
  "language" TEXT,
  "hasChildcare" BOOLEAN DEFAULT 0,
  "tags" TEXT,
  "isPublic" BOOLEAN DEFAULT 0,
  "isActive" BOOLEAN DEFAULT 1,
  "createdByUserId" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME,
  "archivedAt" DATETIME,
  FOREIGN KEY (tenantId) REFERENCES "Tenant" (id) ON DELETE CASCADE,
  FOREIGN KEY (leaderUserId) REFERENCES "User" (id) ON DELETE SET NULL,
  FOREIGN KEY (createdByUserId) REFERENCES "User" (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "SmallGroup_tenantId_idx" ON "SmallGroup" ("tenantId");

CREATE TABLE IF NOT EXISTS "SmallGroupMembership" (
  "id" TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'MEMBER',
  "status" TEXT DEFAULT 'PENDING',
  "joinedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "leftAt" DATETIME,
  "addedByUserId" TEXT,
  FOREIGN KEY (groupId) REFERENCES "SmallGroup" (id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES "User" (id) ON DELETE CASCADE,
  FOREIGN KEY (addedByUserId) REFERENCES "User" (id) ON DELETE SET NULL,
  UNIQUE (groupId, userId)
);

CREATE INDEX IF NOT EXISTS "SmallGroupMembership_groupId_idx" ON "SmallGroupMembership" ("groupId");

-- End of migration
