-- Safe SQL migration to add small group resources and announcements tables
-- This file is intentionally idempotent using IF NOT EXISTS for SQLite

CREATE TABLE IF NOT EXISTS "SmallGroupResource" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "uploaderUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SmallGroupAnnouncement" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Note: foreign keys are intentionally omitted in this quick migration to avoid
-- migration complications in existing DBs. Use a later migration to add FK constraints if desired.
