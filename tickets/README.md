# Temple Platform - Tickets & Backlog

This directory contains issue tickets for tracking work items across all phases of the Temple platform hardening project.

## Active Tickets

### Phase A - Foundation & Data Model

- **[#0001](0001-complete-async-params-migration.md)** - Complete Next.js 16 Async Params Migration - **RESOLVED** - HIGH
- **[#0002](0002-type-system-alignment.md)** - Align Type System - Prisma vs Custom Types - **OPEN** - CRITICAL

## Ticket Status

- **OPEN** - Work not yet started or in progress
- **RESOLVED** - Work completed and verified

## Creating New Tickets

When creating a new ticket, use the following template:

```markdown
# Ticket #XXXX: Title

**Status:** OPEN/RESOLVED

**Priority:** HIGH/MEDIUM/LOW
**Phase:** Phase A/B/C/D/E
**Created:** YYYY-MM-DD

## Context
Brief description of the problem or feature

## Steps Required
1. Step 1
2. Step 2

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Links
- Related: todo.md section X
- Related tickets: #YYYY

## Notes
Additional context or considerations
```

## Backlog Organization

Tickets are organized by Phase (matching todo.md):
- Phase A: Foundation & Data Model
- Phase B: Auth, Sessions, Permissions
- Phase C: Tenant Features
- Phase D: Admin, Notifications, Community
- Phase E: Hardening, Observability, DX
