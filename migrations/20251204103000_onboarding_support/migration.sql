-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN "welcomePacketUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN "welcomePacketVersion" INTEGER DEFAULT 1;
ALTER TABLE "TenantSettings" ADD COLUMN "newMemberAlertChannels" TEXT DEFAULT '["email"]';

-- AlterTable
ALTER TABLE "UserTenantMembership" ADD COLUMN "welcomePacketUrl" TEXT;
ALTER TABLE "UserTenantMembership" ADD COLUMN "welcomePacketVersion" INTEGER;
ALTER TABLE "UserTenantMembership" ADD COLUMN "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "UserTenantMembership" ADD COLUMN "alertSentAt" DATETIME;
ALTER TABLE "UserTenantMembership" ADD COLUMN "alertChannels" TEXT DEFAULT '[]';
