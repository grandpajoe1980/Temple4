# Session Startup Checklist

Use this checklist at the start of every session to orient yourself quickly.

## 1. Read Key Files (5 minutes)

- [ ] **CURRENT-STATE.md** - Quick status overview
- [ ] **docs/journal.md** - Read latest 2-3 entries
- [ ] **tickets/README.md** - Check active tickets
- [ ] **todo.md** - Review current phase

## 2. Check Build Status (2 minutes)

```bash
cd /home/runner/work/Temple4/Temple4
npm install  # if first time
npm run build 2>&1 | tail -50
```

- [ ] Note: Turbopack status
- [ ] Note: TypeScript error count
- [ ] Compare with CURRENT-STATE.md

## 3. Review Active Tickets (3 minutes)

```bash
ls -la tickets/*.md
cat tickets/README.md
```

Current tickets:
- [ ] Check status of Ticket #0001
- [ ] Check status of Ticket #0002
- [ ] Note any new tickets

## 4. Orient to Current Work (2 minutes)

From CURRENT-STATE.md, identify:
- [ ] Current phase
- [ ] Last session's work
- [ ] Next planned work
- [ ] Any blockers

## 5. Check Git Status (1 minute)

```bash
git status
git log --oneline -5
```

- [ ] Note current branch
- [ ] Check for uncommitted changes
- [ ] Review recent commits

## 6. Decide Next Action (1 minute)

Based on readings, choose:
- [ ] Continue previous work (what?)
- [ ] Start new ticket (which?)
- [ ] Fix urgent issue (what?)

## 7. Update Journal (1 minute)

```bash
# Append to docs/journal.md
echo "## Session N: $(date -u +%Y-%m-%dT%H:%M) - [Your Focus]" >> docs/journal.md
```

- [ ] Note session start time
- [ ] Note planned focus
- [ ] List key objectives

---

## Quick Commands

**Build & Errors:**
```bash
npm run build                          # Full build
npx tsc --noEmit 2>&1 | wc -l         # Count errors
npx tsc --noEmit 2>&1 | head -50      # First 50 errors
```

**Code Search:**
```bash
grep -r "PATTERN" app/                # Search app directory
find app/ -name "*.tsx" | wc -l       # Count TypeScript files
```

**Documentation:**
```bash
cat CURRENT-STATE.md                  # Quick status
tail -100 docs/journal.md             # Latest journal entries
cat tickets/0002-*.md                 # Read Ticket #0002
```

---

## After Session Checklist

Before ending your session:

- [ ] Update `docs/journal.md` with work done
- [ ] Update relevant ticket status
- [ ] Commit changes with clear message
- [ ] Update `CURRENT-STATE.md` if major progress
- [ ] Note any blockers or questions

---

**Total Time: ~15 minutes to orient fully**

Quick version (5 min): Read CURRENT-STATE.md + check build + review latest journal entry
