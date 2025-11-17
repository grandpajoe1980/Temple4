# GitHub Copilot Instructions for Temple Platform

## Project Overview

Temple Platform is a comprehensive multi-tenant platform built with Next.js for religious organizations (churches, temples, mosques) to manage their communities, content, events, and member engagement.

### Key Features
- Multi-tenant architecture with isolated data per organization
- Member management with role-based access control
- Content management (posts, sermons, events, books, podcasts)
- Communication features (messaging, announcements, prayer walls)
- Event management with calendar and RSVPs
- Small groups for community building
- Customizable branding and themes
- Admin dashboard with analytics and audit logs

## Technology Stack

- **Framework**: Next.js 16 (App Router architecture)
- **Language**: TypeScript (strict mode enabled)
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Testing**: Custom TypeScript test suite

## Coding Standards

### TypeScript

- Use TypeScript strict mode for all code
- Always define proper types and interfaces - avoid using `any` unless absolutely necessary
- Use Zod for runtime validation of API inputs
- Follow the existing import pattern:
  ```typescript
  import { getServerSession } from 'next-auth/next';
  import { authOptions } from '@/app/api/auth/[...nextauth]/route';
  import { NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';
  ```
- Use the `@/` path alias for imports (mapped in tsconfig.json)

### Code Style

- Use single quotes for strings
- Use 2-space indentation
- Add semicolons at the end of statements
- Use arrow functions for React components and callbacks
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names (e.g., `currentUserId`, not `uid`)

### React/Next.js

- Use React Server Components by default (Next.js App Router)
- Mark client components explicitly with `'use client'` directive
- Follow Next.js 16 App Router patterns for routing and layouts
- Use `getServerSession` from NextAuth for authentication in server components
- Always validate session and user authentication before performing protected operations

### API Routes

- Place API routes in `app/api/` following Next.js App Router conventions
- Always validate authentication using `getServerSession(authOptions)`
- Use Zod schemas for request validation
- Return proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad request (validation errors)
  - 401: Unauthorized (not authenticated)
  - 403: Forbidden (authenticated but not authorized)
  - 404: Not found
  - 409: Conflict (e.g., duplicate slug)
  - 500: Internal server error
- Use NextResponse.json() for all API responses
- Follow the existing pattern for error handling and validation

## Database and Prisma

### Schema

- Database schema is defined in `schema.prisma`
- Use Prisma enums for status fields (TenantRole, MembershipStatus, etc.)
- Follow the existing multi-tenant data model
- Always use transactions for operations affecting multiple tables

### Queries

- Import Prisma client from `@/lib/db`:
  ```typescript
  import { prisma } from '@/lib/db';
  ```
- Always include proper error handling for database operations
- Use Prisma's type-safe query API
- Use `include` to fetch related data when needed
- Use `select` to limit fields when performance matters

### Multi-Tenant Architecture

- Each tenant is isolated by `tenantId`
- Always validate tenant membership and roles before operations
- Use the TenantRole enum: MEMBER, STAFF, CLERGY, MODERATOR, ADMIN
- Check permissions using the tenant membership roles
- Tenant slugs must be unique and URL-safe (lowercase letters, numbers, hyphens)

## Authentication and Authorization

### Session Management

- Use NextAuth.js for authentication
- Session configuration is in `app/api/auth/[...nextauth]/route.ts`
- Always check `session?.user?.id` exists before accessing user ID
- Cast session.user to access custom properties: `(session.user as any).id`

### Authorization Patterns

```typescript
// Check authentication
const session = await getServerSession(authOptions);
if (!session || !(session.user as any)?.id) {
  return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
}

// Check tenant membership
const membership = await prisma.tenantMembership.findFirst({
  where: { 
    userId: currentUserId, 
    tenantId: tenantId,
    status: MembershipStatus.APPROVED 
  },
  include: { roles: true }
});

if (!membership) {
  return NextResponse.json({ message: 'Not a member' }, { status: 403 });
}

// Check for specific role (e.g., ADMIN)
const hasAdminRole = membership.roles.some(r => r.role === TenantRole.ADMIN);
if (!hasAdminRole) {
  return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
}
```

## Testing

### Test Suite

- Comprehensive test suite located in `test-suite/` directory
- Tests cover API endpoints, pages, and feature workflows
- Run tests with: `npm run test:all`
- Test results are saved in `test-results/` directory

### Writing Tests

- Add tests to appropriate suite:
  - `api-tests.ts`: API endpoint tests
  - `page-tests.ts`: Page loading tests
  - `feature-tests.ts`: Feature workflow tests
- Follow the existing test patterns
- Always test both success and error cases
- Test authentication and authorization
- Validate error messages and status codes

### Testing Best Practices

- Run tests before committing changes
- Ensure the development server is running: `npm run dev`
- Database should be seeded: `npm run db:seed`
- All tests should pass before submitting a PR
- Review test results in `test-results/test-report-*.txt`

## Development Workflow

### Setup

```bash
npm install              # Install dependencies
npm run db:seed          # Seed database with test data
npm run dev              # Start development server
```

### Common Commands

- `npm run dev`: Start development server (http://localhost:3000)
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test:all`: Run all tests
- `npm run test:api`: Run API tests only
- `npm run test:pages`: Run page tests only
- `npm run test:features`: Run feature workflow tests only

### File Structure

```
app/
├── api/              # API routes
├── auth/             # Authentication pages
├── tenants/          # Tenant pages
├── components/       # Shared components
├── layout.tsx        # Root layout
└── page.tsx          # Home page

lib/                  # Utility functions
prisma/               # Database schema and migrations
test-suite/           # Test suite
components/           # UI components (Radix UI)
```

## Security Best Practices

### Input Validation

- Always validate user input with Zod schemas
- Sanitize data before storing in the database
- Validate tenant slugs match the pattern: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`

### Authentication

- Never skip authentication checks for protected routes
- Always verify session exists before accessing user data
- Use proper HTTP status codes (401 for unauthenticated, 403 for unauthorized)

### Database Security

- Use Prisma's parameterized queries (automatic protection against SQL injection)
- Never expose sensitive data in API responses (e.g., password hashes)
- Use transactions for operations that must be atomic

### Environment Variables

- Never commit secrets or API keys to the repository
- Use `.env` file for environment-specific configuration
- Keep `.env` in `.gitignore`

## Common Patterns

### Creating a New API Route

1. Create file in `app/api/[route]/route.ts`
2. Import required dependencies (NextAuth, Prisma, Zod)
3. Define Zod validation schema
4. Implement HTTP methods (GET, POST, PUT, DELETE)
5. Validate authentication
6. Validate input with Zod
7. Perform database operations with error handling
8. Return proper response with status code

### Adding a New Page

1. Create file in `app/[path]/page.tsx`
2. Use Server Components by default
3. Fetch data in the component (server-side)
4. Handle authentication if needed
5. Use Tailwind CSS for styling
6. Use Radix UI components when appropriate

### Database Migrations

- Edit `schema.prisma` to modify the schema
- Run `npx prisma migrate dev --name description` to create migration
- Run `npx prisma generate` to update Prisma Client

## Error Handling

- Always wrap database operations in try-catch blocks
- Log errors for debugging: `console.error('Error:', error)`
- Return user-friendly error messages
- Include field-specific errors from Zod validation
- Handle edge cases (not found, already exists, etc.)

## Performance Considerations

- Use Prisma's `select` to fetch only needed fields
- Implement pagination for list endpoints
- Use proper database indexes (defined in schema.prisma)
- Avoid N+1 queries by using `include` appropriately
- Cache static data when possible

## Documentation

- Add JSDoc comments for complex functions
- Document API endpoints with request/response examples
- Keep README.md updated with new features
- Update ROUTES.md when adding new routes
- Document breaking changes

## Additional Notes

- The project uses SQLite for development (file: `./dev.db`)
- Branding and settings are stored as JSON in the database
- Audit logs track important tenant actions
- The platform supports multiple creeds/religions
- Each tenant can customize their branding, theme, and permissions
