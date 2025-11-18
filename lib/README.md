# Temple Platform - Library Utilities

This directory contains shared utilities used across the Temple application.

## Core Utilities

### api-response.ts
**Purpose**: Standardized API error handling and response formatting

**Key Features**:
- Consistent error response format with error codes
- Helper functions for common HTTP status codes (401, 403, 404, 409, 400, 500)
- Automatic Zod validation error formatting
- `withErrorHandling` wrapper for automatic try/catch
- Development vs production error message handling

**Usage Example**:
```typescript
import { handleApiError, forbidden, unauthorized } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    
    // ... your logic here
    
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/example' });
  }
}
```

### logger.ts
**Purpose**: Structured logging with context tracking

**Key Features**:
- Log levels: DEBUG, INFO, WARN, ERROR
- Context tracking (userId, tenantId, route, correlationId)
- Development-friendly console output
- Production JSON output for log aggregation
- Child loggers with inherited context
- Performance timing utility

**Usage Example**:
```typescript
import { createRouteLogger, Timer } from '@/lib/logger';

export async function GET(request: Request) {
  const logger = createRouteLogger('GET /api/posts', { tenantId });
  const timer = new Timer('Fetch posts', { tenantId });
  
  logger.info('Starting fetch', { userId, page });
  // ... your logic here
  logger.info('Fetch complete', { count: posts.length });
  
  timer.end(); // Logs duration automatically
}
```

### tenant-isolation.ts
**Purpose**: Ensure tenant data isolation and prevent cross-tenant data leakage

**Key Features**:
- `withTenantScope()` - Guarantees tenantId in where clauses
- `auditTenantIsolation()` - Development-time audit warnings
- `requireTenantAccess()` - Throws error if user lacks tenant access
- List of all tenant-scoped models
- Type guards for membership validation

**Usage Example**:
```typescript
import { withTenantScope, requireTenantAccess } from '@/lib/tenant-isolation';

// Ensure tenantId is always in query
const whereClause = withTenantScope(
  { deletedAt: null },
  tenantId,
  'Post'
);

const posts = await prisma.post.findMany({ where: whereClause });

// Validate user has access
requireTenantAccess(membership, tenantId, userId);
```

## Existing Utilities

### auth.ts
User registration and authentication logic

### audit.ts
Audit logging utilities

### data.ts
Legacy data access functions (being migrated to API routes)

### db.ts
Prisma client instance

### permissions.ts
Permission checking functions (`can`, `hasRole`, `canUserViewContent`, etc.)

### session.ts
Session management utilities

### tenant-context.ts
Tenant resolution and context loading

### utils.ts
General utility functions

## Best Practices

1. **Always use structured logging** instead of `console.log` in API routes
2. **Use error handling utilities** for consistent error responses
3. **Apply tenant isolation helpers** on all tenant-scoped queries
4. **Add context** to logs and errors (userId, tenantId, route)
5. **Use TypeScript types** exported from utilities for consistency

## Migration Notes

When updating API routes to use these utilities:
1. Replace direct `console.error` calls with `logger.error()`
2. Replace manual error responses with helper functions
3. Add `withTenantScope()` to tenant-scoped Prisma queries
4. Use `withErrorHandling()` wrapper or try/catch with `handleApiError()`

See `/app/api/tenants/[tenantId]/posts/route.ts` for a complete example.

## TODO

- [ ] Add external monitoring integration (Sentry/OpenTelemetry) in logger.ts
- [ ] Create automated scripts to detect non-tenant-scoped queries
- [ ] Add rate limiting utilities
- [ ] Add request correlation ID middleware
- [ ] Create API response caching utilities
