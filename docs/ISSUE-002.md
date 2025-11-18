# Issue #002: Add Missing Prisma Models (Book, Podcast, EventRSVP)

**Status:** 🔴 OPEN  
**Priority:** CRITICAL 🔥  
**Phase:** A - Foundation & Data Model  
**Assigned To:** Senior Backend SQL Expert  
**Created:** 2025-11-17  

---

## Problem Statement

Multiple API routes reference Prisma models that don't exist in `schema.prisma`:
- `Book` model (referenced in `/api/tenants/[tenantId]/books/**`)
- `Podcast` model (referenced in `/api/tenants/[tenantId]/podcasts/**`)
- `EventRSVP` model (referenced in `/api/tenants/[tenantId]/events/[eventId]/rsvps/**`)

This causes 20+ TypeScript compilation errors and prevents the application from functioning.

## Impact

- ❌ TypeScript compilation fails with 20+ errors
- ❌ Book management features non-functional
- ❌ Podcast management features non-functional
- ❌ Event RSVP features non-functional
- ❌ Blocks Issue #001 completion

## Required Models

### 1. Book Model
Based on API routes and types.ts, should include:
```prisma
model Book {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  authorUserId  String
  author        User     @relation(fields: [authorUserId], references: [id])
  title         String
  authorName    String   // Book author, not platform user
  description   String?
  imageUrl      String?
  publishedAt   DateTime?
  deletedAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2. Podcast Model
Based on API routes and types.ts, should include:
```prisma
model Podcast {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  authorUserId  String
  author        User     @relation(fields: [authorUserId], references: [id])
  title         String
  description   String?
  audioUrl      String
  imageUrl      String?
  duration      Int?     // Duration in seconds
  publishedAt   DateTime?
  deletedAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3. EventRSVP Model
Based on API routes and spec requirements:
```prisma
model EventRSVP {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  status      RSVPStatus @default(GOING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, eventId])
}

enum RSVPStatus {
  GOING
  INTERESTED
  NOT_GOING
}
```

## Acceptance Criteria

- [ ] All three models added to schema.prisma
- [ ] RSVPStatus enum added if needed
- [ ] Relations properly configured
- [ ] Unique constraints added where appropriate
- [ ] Indexes added for performance (tenantId, userId, eventId)
- [ ] Migration created: `npx prisma migrate dev --name add-book-podcast-rsvp-models`
- [ ] Prisma client regenerated: `npx prisma generate`
- [ ] TypeScript compilation errors reduced significantly
- [ ] Seed data updated to include sample books, podcasts, and RSVPs

## Migration Steps

1. Add models to schema.prisma
2. Create and apply migration
3. Update seed.ts to create sample data
4. Regenerate Prisma client
5. Verify TypeScript compilation
6. Update User and Tenant models to include relations

## Related Issues
- Issue #001 - Enum alignment (blocked by this)
- Issue #003 - Field name mismatches
- Phase C tasks depend on these models

## Notes
- Check types.ts for additional fields that might be needed
- Ensure soft-delete strategy is consistent (deletedAt)
- Consider adding indexes for common queries