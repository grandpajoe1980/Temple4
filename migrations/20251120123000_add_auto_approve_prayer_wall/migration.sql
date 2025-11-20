-- Add autoApprovePrayerWall toggle for prayer wall posts
ALTER TABLE "TenantSettings" ADD COLUMN "autoApprovePrayerWall" BOOLEAN NOT NULL DEFAULT false;
