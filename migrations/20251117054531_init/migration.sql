/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `isDefaultChannel` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `isDirect` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivateGroup` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Conversation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "name" TEXT,
    "isDirectMessage" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("id", "name", "tenantId") SELECT "id", "name", "tenantId" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
