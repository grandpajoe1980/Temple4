/*
  Warnings:

  - Made the column `id` on table `ProfilePostHidden` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
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
INSERT INTO "new_MediaItem" ("authorUserId", "deletedAt", "description", "embedUrl", "fileSize", "id", "mimeType", "publishedAt", "storageKey", "tenantId", "title", "type", "uploadedAt") SELECT "authorUserId", "deletedAt", "description", "embedUrl", "fileSize", "id", "mimeType", "publishedAt", "storageKey", "tenantId", "title", "type", "uploadedAt" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
CREATE TABLE "new_ProfilePostHidden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hiddenByUserId" TEXT,
    "hiddenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfilePostHidden_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilePostHidden_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilePostHidden_hiddenByUserId_fkey" FOREIGN KEY ("hiddenByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProfilePostHidden" ("hiddenAt", "hiddenByUserId", "id", "postId", "tenantId") SELECT coalesce("hiddenAt", CURRENT_TIMESTAMP) AS "hiddenAt", "hiddenByUserId", "id", "postId", "tenantId" FROM "ProfilePostHidden";
DROP TABLE "ProfilePostHidden";
ALTER TABLE "new_ProfilePostHidden" RENAME TO "ProfilePostHidden";
CREATE INDEX "ProfilePostHidden_tenantId_idx" ON "ProfilePostHidden"("tenantId");
CREATE UNIQUE INDEX "ProfilePostHidden_postId_tenantId_key" ON "ProfilePostHidden"("postId", "tenantId");
CREATE TABLE "new_SmallGroupResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmallGroupResource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SmallGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SmallGroupResource_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SmallGroupResource" ("createdAt", "description", "groupId", "id", "tenantId", "title", "uploaderUserId", "url") SELECT "createdAt", "description", "groupId", "id", "tenantId", "title", "uploaderUserId", "url" FROM "SmallGroupResource";
DROP TABLE "SmallGroupResource";
ALTER TABLE "new_SmallGroupResource" RENAME TO "SmallGroupResource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
