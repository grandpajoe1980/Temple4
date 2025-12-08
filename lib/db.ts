import { PrismaClient } from '@prisma/client';
import { getSecret } from './secrets';

declare global {
  var prisma: PrismaClient | undefined;
  var prismaConnectionHealthy: boolean | undefined;
  var prismaLastHealthCheck: number | undefined;
}

// Connection health tracking
const HEALTH_CHECK_INTERVAL_MS = 30000; // Check health every 30 seconds
const CONNECTION_TIMEOUT_SECONDS = 30;
const POOL_TIMEOUT_SECONDS = 30;

// Create a function to get the database URL from secrets with connection parameters
function getDatabaseUrl(): string {
  let baseUrl: string | undefined;
  
  if (process.env.DATABASE_URL) {
    baseUrl = process.env.DATABASE_URL;
  } else {
    try {
      const url = getSecret('DATABASE_URL');
      if (url) {
        baseUrl = url;
      }
    } catch (e) {
      console.error('[db.ts] Failed to get DATABASE_URL from secrets:', e);
    }
  }

  if (!baseUrl) {
    throw new Error('DATABASE_URL is not configured. Please set it in secrets or environment.');
  }

  // Add connection parameters for reliability if not already present
  const enhancedUrl = addConnectionParams(baseUrl);
  
  // Cache the enhanced URL
  process.env.DATABASE_URL = enhancedUrl;
  
  return enhancedUrl;
}

// Add connection parameters to improve reliability
function addConnectionParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Check if this is a Supavisor pooler connection
    const isPoolerConnection = url.includes('pooler.supabase.com');
    
    // IMPORTANT: Convert session mode (port 5432) to transaction mode (port 6543)
    // Transaction mode handles more connections and is better for Next.js dev mode
    // which creates many short-lived connections
    if (isPoolerConnection && urlObj.port === '5432') {
      console.log('[db.ts] Converting from session mode (5432) to transaction mode (6543) for better connection handling');
      urlObj.port = '6543';
    }
    
    // Add connect_timeout if not present (in seconds)
    if (!params.has('connect_timeout')) {
      params.set('connect_timeout', CONNECTION_TIMEOUT_SECONDS.toString());
    }
    
    // Add pool_timeout if not present (in seconds)
    if (!params.has('pool_timeout')) {
      params.set('pool_timeout', POOL_TIMEOUT_SECONDS.toString());
    }
    
    // For Supavisor transaction mode, add pgbouncer=true to disable prepared statements
    if (isPoolerConnection && !params.has('pgbouncer')) {
      params.set('pgbouncer', 'true');
    }
    
    // Limit Prisma's connection pool to avoid overwhelming Supavisor
    // In dev mode, we don't need many connections
    if (!params.has('connection_limit')) {
      params.set('connection_limit', '3');
    }
    
    urlObj.search = params.toString();
    return urlObj.toString();
  } catch (e) {
    console.warn('[db.ts] Could not parse DATABASE_URL to add connection params:', e);
    return url;
  }
}

// Helpers
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Add jitter to prevent thundering herd
function sleepWithJitter(baseMs: number) {
  const jitter = Math.random() * baseMs * 0.3; // Up to 30% jitter
  return sleep(baseMs + jitter);
}

function isConnectionError(err: any) {
  if (!err) return false;
  const msg = (err.message || '').toString().toLowerCase();
  const code = err.code || '';
  return (
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('connection terminated') ||
    msg.includes('connection timed out') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1008' ||
    code === 'P1017'
  );
}

// Attempt to reconnect the Prisma client
async function attemptReconnect(client: PrismaClient): Promise<boolean> {
  try {
    await client.$disconnect();
  } catch (_) {
    // Ignore disconnect errors
  }
  
  try {
    await client.$connect();
    globalThis.prismaConnectionHealthy = true;
    globalThis.prismaLastHealthCheck = Date.now();
    console.log('[db.ts] Reconnection successful');
    return true;
  } catch (err) {
    console.error('[db.ts] Reconnection failed:', err);
    globalThis.prismaConnectionHealthy = false;
    return false;
  }
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
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

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

// Wrapper function that adds retry logic for connection errors
async function withRetry<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
  const maxAttempts = 5;
  let attempt = 0;
  let delay = 500;

  while (true) {
    try {
      const result = await operation();
      // Mark connection as healthy on success
      globalThis.prismaConnectionHealthy = true;
      globalThis.prismaLastHealthCheck = Date.now();
      return result;
    } catch (err) {
      attempt += 1;
      if (!isConnectionError(err)) {
        // Not a connection error, throw immediately
        throw err;
      }
      
      if (attempt >= maxAttempts) {
        console.error(`[db.ts] ${operationName || 'Operation'} failed after ${maxAttempts} attempts, giving up`);
        globalThis.prismaConnectionHealthy = false;
        throw err;
      }
      
      console.warn(`[db.ts] ${operationName || 'Operation'} failed with connection error (attempt ${attempt}/${maxAttempts}), retrying after ${delay}ms...`);
      globalThis.prismaConnectionHealthy = false;
      
      // Wait with jitter before retry
      await sleepWithJitter(delay);
      
      // Attempt to reconnect if we have an instance
      if (_prismaInstance) {
        await attemptReconnect(_prismaInstance);
      }
      
      // Exponential backoff with cap
      delay = Math.min(delay * 2, 8000);
      // loop and retry
    }
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

  // Initialize health tracking
  globalThis.prismaConnectionHealthy = false;
  globalThis.prismaLastHealthCheck = 0;

  // Start background connect + retries to pre-warm and reduce transient errors
  (async () => {
    const maxAttempts = 8;
    let attempt = 0;
    let delay = 1000;
    
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await client.$connect();
        console.log(`[db.ts] Background Prisma $connect succeeded on attempt ${attempt}`);
        globalThis.prismaConnectionHealthy = true;
        globalThis.prismaLastHealthCheck = Date.now();
        
        // Start periodic health check
        startHealthCheck(client);
        return;
      } catch (err) {
        let errMsg: string;
        if (err && typeof err === 'object' && 'message' in err) {
          errMsg = (err as any).message;
        } else {
          errMsg = String(err);
        }
        console.warn(`[db.ts] Background Prisma $connect attempt ${attempt}/${maxAttempts} failed: ${errMsg}`);
        
        try {
          await client.$disconnect();
        } catch (_) {}
        
        if (attempt >= maxAttempts) {
          console.error('[db.ts] Background Prisma connect failed after max attempts - will retry on first query');
          globalThis.prismaConnectionHealthy = false;
          return;
        }
        
        // Exponential backoff with jitter
        await sleepWithJitter(delay);
        delay = Math.min(delay * 1.5, 10000);
      }
    }
  })();

  return _prismaInstance;
}

// Periodic health check to detect connection issues early
let healthCheckInterval: NodeJS.Timeout | null = null;

function startHealthCheck(client: PrismaClient) {
  // Clear any existing interval
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    // Skip if we recently checked
    const lastCheck = globalThis.prismaLastHealthCheck || 0;
    if (Date.now() - lastCheck < HEALTH_CHECK_INTERVAL_MS) {
      return;
    }
    
    try {
      // Simple query to check connection
      await client.$queryRaw`SELECT 1`;
      globalThis.prismaConnectionHealthy = true;
      globalThis.prismaLastHealthCheck = Date.now();
    } catch (err) {
      console.warn('[db.ts] Health check failed, connection may be unhealthy');
      globalThis.prismaConnectionHealthy = false;
      
      // Attempt to reconnect in background
      attemptReconnect(client).catch(() => {});
    }
  }, HEALTH_CHECK_INTERVAL_MS);
  
  // Don't block process exit
  if (healthCheckInterval.unref) {
    healthCheckInterval.unref();
  }
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

// Export helper to check connection health
export function isDatabaseHealthy(): boolean {
  return globalThis.prismaConnectionHealthy === true;
}

// Export helper to force reconnection
export async function forceReconnect(): Promise<boolean> {
  const client = getPrisma();
  return attemptReconnect(client);
}
