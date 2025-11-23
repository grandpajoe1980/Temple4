-- CreateEnum for ProfilePostType
CREATE TABLE "_ProfilePostType_enum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "_ProfilePostType_enum" VALUES ('TEXT'), ('IMAGE'), ('VIDEO'), ('LINK'), ('MIXED');

-- CreateEnum for ProfilePostPrivacy
CREATE TABLE "_ProfilePostPrivacy_enum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "_ProfilePostPrivacy_enum" VALUES ('PUBLIC'), ('FRIENDS'), ('PRIVATE');

-- CreateEnum for MediaType  
CREATE TABLE "_MediaType_enum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "_MediaType_enum" VALUES ('IMAGE'), ('VIDEO'), ('AUDIO');

-- CreateEnum for ReactionType
CREATE TABLE "_ReactionType_enum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "_ReactionType_enum" VALUES ('LIKE'), ('LOVE'), ('LAUGH'), ('WOW'), ('SAD'), ('ANGRY');

-- CreateTable ProfilePost
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

-- CreateTable ProfilePostMedia
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

-- CreateTable ProfilePostReaction
CREATE TABLE "ProfilePostReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfilePostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ProfilePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilePostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable ProfilePostComment
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

-- CreateIndex
CREATE INDEX "ProfilePost_userId_createdAt_idx" ON "ProfilePost"("userId", "createdAt");
CREATE INDEX "ProfilePost_userId_privacy_createdAt_idx" ON "ProfilePost"("userId", "privacy", "createdAt");
CREATE INDEX "ProfilePostMedia_postId_order_idx" ON "ProfilePostMedia"("postId", "order");
CREATE UNIQUE INDEX "ProfilePostReaction_postId_userId_key" ON "ProfilePostReaction"("postId", "userId");
CREATE INDEX "ProfilePostReaction_postId_idx" ON "ProfilePostReaction"("postId");
CREATE INDEX "ProfilePostReaction_userId_idx" ON "ProfilePostReaction"("userId");
CREATE INDEX "ProfilePostComment_postId_createdAt_idx" ON "ProfilePostComment"("postId", "createdAt");
CREATE INDEX "ProfilePostComment_userId_idx" ON "ProfilePostComment"("userId");
