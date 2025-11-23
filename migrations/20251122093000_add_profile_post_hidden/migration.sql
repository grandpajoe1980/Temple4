-- Migration: add_profile_post_hidden
-- Creates a table to store tenant-level hides for profile posts

CREATE TABLE "ProfilePostHidden" (
  "id" TEXT PRIMARY KEY DEFAULT (cuid()),
  "postId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hiddenByUserId" TEXT,
  "hiddenAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfilePostHidden_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfilePostHidden_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfilePostHidden_hiddenByUserId_fkey" FOREIGN KEY ("hiddenByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProfilePostHidden_postId_tenantId_key" ON "ProfilePostHidden" ("postId", "tenantId");
CREATE INDEX "ProfilePostHidden_tenantId_idx" ON "ProfilePostHidden" ("tenantId");
