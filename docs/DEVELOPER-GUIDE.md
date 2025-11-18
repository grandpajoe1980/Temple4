# Temple Platform - Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflows](#development-workflows)
4. [Code Patterns & Best Practices](#code-patterns--best-practices)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Key Concepts](#key-concepts)

---

## Getting Started

### First Time Setup

Follow the [Quick Start in README.md](README.md#quick-start-for-new-developers) for initial setup. Once complete, you should have:
- ✅ Dependencies installed
- ✅ Database initialized and seeded
- ✅ Dev server running on http://localhost:3000
- ✅ Test suite passing (54/61 tests)

### Understanding the Codebase

Start by reading these files in order:
1. **[projectplan.md](projectplan.md)** - What Temple is and what it does
2. **[backend.md](backend.md)** - Architecture and design principles
3. **[ROUTES.md](ROUTES.md)** - URL structure and navigation
4. **[todo.md](todo.md)** - Current status and remaining work
5. **[WORK-JOURNAL.md](WORK-JOURNAL.md)** - Recent development history

---

## Architecture Overview

### Technology Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **Database:** SQLite (dev) via Prisma ORM → Postgres (production)
- **Auth:** NextAuth.js with credentials provider
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives + custom components
- **Testing:** Custom TypeScript test suite

### Three-Layer Architecture

All backend code follows a strict 3-layer pattern:

```
┌─────────────────────────────────────┐
│  Route Handlers (app/api/)          │  ← HTTP request/response
│  - Parse input                       │
│  - Call service layer                │
│  - Map to HTTP responses             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Service Layer (lib/)                │  ← Business logic
│  - Permissions & authorization       │
│  - Business rules                    │
│  - Orchestration                     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Data Access Layer (Prisma)          │  ← Database queries
│  - Prisma queries only               │
│  - No business logic                 │
│  - Tenant-scoped queries             │
└─────────────────────────────────────┘
```

**Rules:**
- Route handlers NEVER contain business logic
- React components NEVER call Prisma directly
- Service layer handles ALL permissions checks
- All tenant data MUST be scoped by `tenantId`

### Project Structure

```
Temple4/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── auth/              # Authentication endpoints
│   │   ├── tenants/           # Tenant-scoped endpoints
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── tenant/           # Tenant-specific components
│   ├── auth/                  # Auth pages (login, register, etc.)
│   ├── tenants/               # Tenant pages
│   ├── admin/                 # Admin console
│   └── layout.tsx             # Root layout
├── lib/
│   ├── permissions.ts         # Authorization logic
│   ├── tenant-context.ts      # Tenant resolution
│   ├── api-response.ts        # Standardized API responses
│   ├── logger.ts              # Structured logging
│   ├── audit.ts               # Audit logging
│   ├── auth.ts                # Auth utilities
│   └── data.ts                # Data access functions
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Test data seeding
├── test-suite/                # Comprehensive test suite
├── types.ts                   # Shared TypeScript types
└── ...
```

---

## Development Workflows

### Adding a New Feature

1. **Update the Database Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name add_feature_name
   npx prisma generate
   ```

2. **Update Types** (if needed)
   ```typescript
   // Update types.ts to match Prisma schema
   ```

3. **Create Service Functions**
   ```typescript
   // lib/featureService.ts
   export async function getFeature(id: string) {
     // Business logic here
   }
   ```

4. **Create API Route**
   ```typescript
   // app/api/features/route.ts
   import { NextRequest } from 'next/server';
   import { getServerSession } from 'next-auth';
   import { getFeature } from '@/lib/featureService';
   
   export async function GET(req: NextRequest) {
     const session = await getServerSession(authOptions);
     // ... call service, return response
   }
   ```

5. **Create UI Components**
   ```typescript
   // app/components/FeatureComponent.tsx
   'use client';
   // ... component code
   ```

6. **Create Page**
   ```typescript
   // app/features/page.tsx
   // Server component that calls API or service
   ```

7. **Test**
   ```bash
   npm run test:all
   ```

### Adding a New API Endpoint

Example: `GET /api/tenants/:tenantId/features`

```typescript
// app/api/tenants/[tenantId]/features/route.ts

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { notFound, unauthorized, withErrorHandling } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) => {
  // 1. Authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return unauthorized();
  }

  // 2. Parse params
  const { tenantId } = await params;
  
  // 3. Load required data
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  if (!tenant) {
    return notFound('Tenant not found');
  }

  // 4. Authorization check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  
  const hasPermission = await can(user, tenant, 'canViewFeatures');
  if (!hasPermission) {
    return unauthorized('You do not have permission to view features');
  }

  // 5. Business logic (or call service)
  const features = await prisma.feature.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });

  // 6. Return response
  return Response.json({ features });
});
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name describe_your_change

# Apply migrations (if needed manually)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npm run db:seed

# Open Prisma Studio (GUI for database)
npx prisma studio
```

---

## Code Patterns & Best Practices

### Error Handling

Use the standardized error response utilities:

```typescript
import { 
  unauthorized, 
  forbidden, 
  notFound, 
  conflict,
  validationError,
  withErrorHandling 
} from '@/lib/api-response';

// Wrap route handlers
export const GET = withErrorHandling(async (req, { params }) => {
  // Your code here
  // Errors are automatically caught and formatted
});

// Manual error responses
if (!session) {
  return unauthorized();
}

if (!hasPermission) {
  return forbidden('You cannot access this resource');
}

if (!entity) {
  return notFound('Entity not found');
}
```

### Logging

Use structured logging for better observability:

```typescript
import { logger } from '@/lib/logger';

// Info logging
logger.info('User logged in', { userId: user.id });

// Error logging
logger.error('Failed to create post', { error, userId, tenantId });

// Child logger with context
const log = logger.child({ userId, tenantId });
log.info('Processing request');

// Performance monitoring
const timer = logger.timer();
// ... do work ...
const elapsed = timer.end('Operation name');
```

### Permissions

Always use the centralized permission system:

```typescript
import { can, hasRole } from '@/lib/permissions';

// Check specific permission
const canEdit = await can(user, tenant, 'canEditPosts');

// Check role
const isAdmin = hasRole(user, tenant, 'ADMIN');

// Permission constants
// Available permissions:
// - canCreatePosts, canEditPosts, canDeletePosts
// - canCreateEvents, canManageEvents
// - canApproveMembership, canBanMembers
// - canManageDonations, canModerateChats
// - canManageVolunteerNeeds, canManageSmallGroups
// - canManagePrayerWall, canManageResources
```

### Tenant Isolation

ALWAYS scope queries by tenant:

```typescript
// ✅ GOOD - Scoped by tenant
const posts = await prisma.post.findMany({
  where: { 
    tenantId,  // ← Always include this
    isDeleted: false
  }
});

// ❌ BAD - Could leak data across tenants
const posts = await prisma.post.findMany({
  where: { isDeleted: false }  // Missing tenantId!
});
```

### Validation

Use Zod for input validation:

```typescript
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(['BLOG', 'ANNOUNCEMENT']),
  isPublished: z.boolean().default(false)
});

// In route handler
export const POST = withErrorHandling(async (req) => {
  const body = await req.json();
  
  // Validate - automatically returns 400 if invalid
  const data = CreatePostSchema.parse(body);
  
  // Use validated data
  const post = await prisma.post.create({ data });
});
```

### Audit Logging

Log important actions:

```typescript
import { logAuditEvent } from '@/lib/audit';

await logAuditEvent({
  actorUserId: session.user.id,
  effectiveUserId: session.user.id,
  actionType: 'TENANT_CREATED',
  entityType: 'Tenant',
  entityId: tenant.id,
  tenantId: tenant.id,
  metadata: { name: tenant.name }
});
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:api      # API endpoint tests
npm run test:pages    # Page loading tests  
npm run test:features # Feature workflow tests
```

### Test Results

Results are saved in `test-results/`:
- `test-report-*.txt` - Human-readable report (read this first!)
- `test-summary-*.json` - Summary statistics
- `test-issues-*.json` - Only failures and errors

### Understanding Test Failures

**Expected Failures (6 tests):**
- These fail due to Node.js `fetch()` not handling HTTP-only cookies
- NOT bugs in the application
- The auth system works correctly in browsers

**Unexpected Failures:**
- Investigate in this order:
  1. Check server logs for errors
  2. Verify database seeding completed
  3. Check API route implementation
  4. Verify permissions are correct

### Writing Tests

Add tests to the appropriate file:
- `test-suite/api-tests.ts` - API endpoint tests
- `test-suite/page-tests.ts` - Page loading tests
- `test-suite/feature-tests.ts` - End-to-end workflows

Example API test:

```typescript
{
  name: 'GET /api/features - Returns features',
  run: async () => {
    const response = await fetch(`${BASE_URL}/api/features`);
    assertEqual(response.status, 200);
    const data = await response.json();
    assertTrue(Array.isArray(data.features));
  }
}
```

---

## Troubleshooting

### Build Errors

```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear build cache
rm -rf .next
npm run build
```

### Database Issues

```bash
# View database in GUI
npx prisma studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

### Authentication Issues

1. Verify `.env.local` has:
   ```
   NEXTAUTH_SECRET=<your-secret>
   NEXTAUTH_URL=http://localhost:3000
   ```

2. Check session in browser DevTools:
   - Application tab → Cookies → Look for `next-auth.session-token`

3. Verify user exists in database:
   ```bash
   npx prisma studio
   # Navigate to User table
   ```

### API Errors

1. Check server console for detailed error logs
2. Use browser DevTools → Network tab to see request/response
3. Check response status and error message
4. Verify authentication (include session cookie)
5. Check permissions for the user/tenant combination

### Test Failures

1. **Database not seeded:**
   ```bash
   npm run db:seed
   ```

2. **Server not running:**
   ```bash
   npm run dev
   # In another terminal:
   npm run test:all
   ```

3. **Wrong base URL:**
   - Check `test-suite/test-config.ts`
   - Should be `http://localhost:3000`

---

## Key Concepts

### Multi-Tenancy

- Each tenant (temple/church/mosque) is isolated
- Users can be members of multiple tenants
- All tenant data MUST be scoped by `tenantId`
- Never query across tenants unless you're a super admin

### Roles & Permissions

**Tenant Roles:**
- `MEMBER` - Basic member
- `STAFF` - Can create content
- `MODERATOR` - Can moderate content and members
- `CLERGY` - Religious leader role
- `ADMIN` - Full tenant administration

**Super Admin:**
- Platform-level admin (not tenant-specific)
- Can impersonate users
- Can access admin console
- Stored in `User.isSuperAdmin` field

### Feature Toggles

Tenants can enable/disable features in `TenantSettings`:
- `enablePrayerWall`
- `enableDonations`
- `enableVolunteering`
- `enableSmallGroups`
- `enableLiveStream`
- `enableResourceCenter`

Always check if a feature is enabled before allowing access.

### Soft Deletes

Content uses soft deletes:
- Posts, Events, MediaItems have `isDeleted` or `deletedAt`
- Always filter: `where: { isDeleted: false }`
- Admins can still view deleted content

### Audit Logging

All important actions are logged to `AuditLog`:
- User registration
- Tenant creation/updates
- Membership status changes
- Permission changes
- Content deletion
- Impersonation start/end

This creates an immutable audit trail for security and compliance.

---

## Resources

- **Documentation:**
  - [README.md](README.md) - Project overview
  - [projectplan.md](projectplan.md) - Product specification
  - [backend.md](backend.md) - Architecture details
  - [ROUTES.md](ROUTES.md) - URL structure
  - [todo.md](todo.md) - Project status

- **Test Suite:**
  - [test-suite/README.md](test-suite/README.md) - Test suite overview
  - [test-suite/DOCUMENTATION.md](test-suite/DOCUMENTATION.md) - Detailed docs
  - [test-suite/QUICK-REFERENCE.md](test-suite/QUICK-REFERENCE.md) - Quick reference

- **External:**
  - [Next.js 16 Docs](https://nextjs.org/docs)
  - [Prisma Docs](https://www.prisma.io/docs)
  - [NextAuth.js Docs](https://next-auth.js.org)
  - [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Getting Help

1. **Check Documentation** - Read the docs listed above
2. **Check Logs** - Server console and browser DevTools
3. **Run Tests** - `npm run test:all` to identify issues
4. **Review Code** - Look at similar working features
5. **Ask for Help** - Open an issue with:
   - What you're trying to do
   - What's happening instead
   - Error messages and logs
   - Steps to reproduce
