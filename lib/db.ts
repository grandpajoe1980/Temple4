import { PrismaClient } from '@prisma/client';
import { getSecret } from './secrets';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create a function to get the database URL from secrets
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

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

// Helpers
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function isConnectionError(err: any) {
  if (!err) return false;
  const msg = (err.message || '').toString();
  return msg.includes("Can't reach database server") || msg.includes('P1001');
}

// Create a synchronous Prisma client and attach middleware to retry transient connection errors.
function createPrismaClientSync(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  console.log('[db.ts] Creating Prisma client with DATABASE_URL host:', extractHostFromUrl(databaseUrl));

  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Middleware: retry transient connection errors for queries
  // Use an `any` cast to avoid TypeScript mismatch for `$use` on generated PrismaClient types.
  // Some runtime environments or bundlers may provide a Prisma client stub without `$use`.
  // Guard to avoid crashing at startup if `$use` is unavailable.
  const maybeUse = (client as any).$use;
  if (typeof maybeUse === 'function') {
    (client as any).$use(async (params: any, next: any) => {
      const maxAttempts = 4;
      let attempt = 0;
      let delay = 300;

      while (true) {
        try {
          return await next(params);
        } catch (err) {
          attempt += 1;
          if (attempt >= maxAttempts || !isConnectionError(err)) {
            throw err;
          }
          console.warn(`[db.ts] Query failed with connection error, retrying attempt ${attempt} after ${delay}ms`);
          // eslint-disable-next-line no-await-in-loop
          await sleep(delay);
          delay *= 2;
          // loop and retry
        }
      }
    });
  } else {
    console.warn('[db.ts] Prisma client instance does not expose `$use`; skipping query middleware');
  }

  return client;
}

function extractHostFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url;
  }
}

let _prismaInstance: PrismaClient | undefined = globalThis.prisma;

export function getPrisma(): PrismaClient {
  if (_prismaInstance) return _prismaInstance;

  const client = createPrismaClientSync();
  _prismaInstance = client;
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client;
  }

  // Start background connect + retries to pre-warm and reduce transient errors
  (async () => {
    const maxAttempts = 6;
    let attempt = 0;
    let delay = 500;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await client.$connect();
        console.log(`[db.ts] Background Prisma $connect succeeded on attempt ${attempt}`);
        return;
      } catch (err) {
        let errMsg: string;
        if (err && typeof err === 'object' && 'message' in err) {
          errMsg = (err as any).message;
        } else {
          errMsg = String(err);
        }
        console.warn(`[db.ts] Background Prisma $connect attempt ${attempt} failed: ${errMsg}`);
        try {
          await client.$disconnect();
        } catch (_) {}
        if (attempt >= maxAttempts) {
          console.error('[db.ts] Background Prisma connect failed after max attempts');
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
        delay *= 2;
      }
    }
  })();

  return _prismaInstance;
}

// Export `prisma` as a Proxy so existing imports calling `prisma.xxx()` continue to work
// The proxy will initialize the real client on first property access.
export const prisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop: PropertyKey) {
    const client = getPrisma();
    // @ts-ignore
    const val = client[prop as keyof PrismaClient];
    if (typeof val === 'function') return val.bind(client);
    return val;
  },
  set(_target, prop: PropertyKey, value: any) {
    const client = getPrisma();
    // @ts-ignore
    client[prop as keyof PrismaClient] = value;
    return true;
  },
}) as unknown as PrismaClient;
