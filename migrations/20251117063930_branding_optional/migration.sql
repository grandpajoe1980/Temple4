-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TenantBranding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerImageUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "customLinks" JSONB,
    CONSTRAINT "TenantBranding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TenantBranding" ("accentColor", "bannerImageUrl", "customLinks", "id", "logoUrl", "primaryColor", "tenantId") SELECT "accentColor", "bannerImageUrl", "customLinks", "id", "logoUrl", "primaryColor", "tenantId" FROM "TenantBranding";
DROP TABLE "TenantBranding";
ALTER TABLE "new_TenantBranding" RENAME TO "TenantBranding";
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "TenantBranding"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
