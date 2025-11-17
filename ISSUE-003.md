# Issue #003: Fix API Routes Using Non-Existent Model Names

**Status:** 🔴 OPEN  
**Priority:** HIGH  
**Phase:** A - Foundation & Data Model  
**Assigned To:** Senior API Guru  
**Created:** 2025-11-17  

---

## Problem Statement

Multiple API routes reference Prisma model names that don't exist in the schema:
- Routes in `/api/tenants/[tenantId]/sermons/**` reference `prisma.sermon` 
- Routes using `prisma.smallGroupMember` should use `prisma.smallGroupMembership`
- Various field name mismatches (e.g., `authorId` vs `authorUserId`)

## Impact

- ❌ 310+ TypeScript compilation errors
- ❌ Sermon management API routes non-functional
- ❌ Small group member API routes partially broken
- ❌ Blocks application build and deployment

## Required Changes

### 1. Sermon Routes - Use MediaItem Instead
Files affected:
- `app/api/tenants/[tenantId]/sermons/[sermonId]/route.ts`
- `app/api/tenants/[tenantId]/sermons/route.ts`

**Fix:** Replace `prisma.sermon` with `prisma.mediaItem` and filter by `type: 'SERMON_VIDEO'`

Example:
```typescript
// Before:
const sermons = await prisma.sermon.findMany({ ... });

// After:
const sermons = await prisma.mediaItem.findMany({
  where: {
    type: 'SERMON_VIDEO',
    ...otherFilters
  }
});
```

### 2. Small Group Member Routes - Use Correct Model Name
Files affected:
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/route.ts`

**Fix:** Replace `prisma.smallGroupMember` with `prisma.smallGroupMembership`

### 3. Field Name Mismatches

#### Post Model
- Routes expect `authorId` but schema has `authorUserId`
- **Fix:** Update routes to use `authorUserId`

#### Event Model  
- Routes expect `authorId` but schema has `createdByUserId`
- **Fix:** Update routes to use `createdByUserId`

#### Post Model - Additional Issues
- Routes reference `content` field but schema has `body`
- Routes reference `createdAt` for sorting but model doesn't have timestamps
- **Fix:** Use `body` and `publishedAt` instead

### 4. SmallGroup Model Missing Fields
- Routes expect `isPublic` field but model doesn't have it
- Routes expect certain parameters in create but they're missing
- **Fix:** Add `isPublic` field to schema or remove from routes

### 5. Tenant Include Patterns
- Multiple routes try to include `permissions: true` but it's a Json field
- **Fix:** Don't include, just select the field

## Acceptance Criteria

- [ ] All sermon routes use `mediaItem` model with type filter
- [ ] All small group routes use `smallGroupMembership` model
- [ ] Post routes use `authorUserId` and `body` fields correctly
- [ ] Event routes use `createdByUserId` field correctly
- [ ] TypeScript compilation errors reduced significantly (< 50 errors)
- [ ] All affected API routes return correct data

## Migration Required?

May need to:
- [ ] Add `createdAt` and `updatedAt` timestamps to Post model
- [ ] Add `isPublic` field to SmallGroup model if it's a feature
- [ ] Review and standardize field names across all models

## Related Issues
- Issue #001 - Enum alignment
- Issue #002 - Missing models (resolved)
- Blocks all Phase C tasks

## Notes
- This is critical path work - affects most API functionality
- Consider creating a field naming convention document
- May want to run a full audit of field name consistency