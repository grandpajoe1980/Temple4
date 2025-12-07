import { PrismaClient } from '@prisma/client';
import { getSecret } from './secrets';

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
  var prismaInitialized: boolean | undefined;
}

// Create a function to get the database URL from secrets
function getDatabaseUrl(): string {
  // First check if already in environment (set by instrumentation)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fall back to decrypting from secrets
  try {
    const url = getSecret('DATABASE_URL');
    if (url) {
      process.env.DATABASE_URL = url; // Cache it
      return url;
    }
  } catch (e) {
    console.error('[db.ts] Failed to get DATABASE_URL from secrets:', e);
  }
  
  throw new Error('DATABASE_URL is not configured. Please set it in secrets or environment.');
}

// Lazy initialization of Prisma client
function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// Use getter to ensure lazy initialization
export const prisma: PrismaClient = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
