-- Migration: add_conversation_scope_kind
-- SQLite migration: add scope and kind columns to Conversation

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

ALTER TABLE "Conversation" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "Conversation" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'GROUP';

CREATE INDEX IF NOT EXISTS "idx_conversation_scope_tenantId" ON "Conversation" (scope, tenantId);

COMMIT;
PRAGMA foreign_keys=ON;
