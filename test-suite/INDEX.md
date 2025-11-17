# Temple Platform Test Suite - Index

Welcome to the comprehensive test suite for Temple Platform! This document helps you navigate all the available resources.

## 🚀 Quick Start (First Time Users)

**Windows Users:**
```bash
cd test-suite
setup.bat
```

This will:
- Check Node.js installation
- Install dependencies
- Set up database
- Create test-results directory
- Check if server is running

**Then run tests:**
```bash
npm run test:all
```

## 📚 Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [README.md](README.md) | Quick start guide | **Start here** if new to the test suite |
| [QUICK-REFERENCE.md](QUICK-REFERENCE.md) | One-page cheat sheet | Daily use, quick lookup |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Complete guide (7000+ words) | Deep understanding, troubleshooting |
| [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) | What we built | Understanding the architecture |

## 🛠️ Tools & Scripts

| File | Description | Usage |
|------|-------------|-------|
| `setup.bat` | Initialize test environment | Run once: `setup.bat` |
| `run-tests.bat` | Run all tests (Windows) | `run-tests.bat` |
| `view-results.ps1` | View latest results | `powershell .\view-results.ps1` |
| `dashboard.html` | Interactive results viewer | Open in browser, load JSON results |

## 💻 Test Files

| File | Contains | Tests |
|------|----------|-------|
| `run-tests.ts` | Main orchestrator | Runs all tests in order |
| `api-tests.ts` | API endpoint tests | 95+ API endpoints |
| `page-tests.ts` | Page loading tests | 30+ pages |
| `feature-tests.ts` | Feature workflows | 15+ user journeys |
| `test-config.ts` | Configuration | URLs, users, timeouts |
| `test-logger.ts` | Logging system | Report generation |

## 📊 Result Files (after running tests)

| File | Contains | Use For |
|------|----------|---------|
| `test-report-*.txt` | Human-readable report | **Read this first!** |
| `test-issues-*.json` | Only failures/errors | Fixing issues |
| `test-summary-*.json` | Statistics | Metrics, progress tracking |
| `test-results-*.json` | All test details | Dashboard, programmatic access |

## 🎯 Common Tasks

### Running Tests

```bash
# All tests
npm run test:all

# Individual test suites
npm run test:api
npm run test:pages
npm run test:features

# Windows batch script
cd test-suite
run-tests.bat
```

### Viewing Results

```bash
# Option 1: Text report (recommended)
notepad test-results\test-report-*.txt

# Option 2: PowerShell viewer (interactive)
powershell .\test-suite\view-results.ps1

# Option 3: Dashboard (visual)
# Open test-suite\dashboard.html in browser
# Click "Load Test Results"
# Select test-results\test-results-*.json
```

### Fixing Issues

1. Read `test-results/test-report-*.txt`
2. Review `test-results/test-issues-*.json`
3. Group similar issues
4. Fix highest priority first (500 errors)
5. Re-run tests: `npm run test:all`
6. Verify fixes in new report
7. Repeat until all pass

### Getting Help

1. Check [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for quick answers
2. Search [DOCUMENTATION.md](DOCUMENTATION.md) for detailed info
3. Review test code for examples
4. Check server logs for backend errors

## 📋 Test Coverage Overview

### API Endpoints (95+ tests)
- ✅ Authentication (5 tests)
- ✅ Tenants (5 tests)
- ✅ Members (4 tests)
- ✅ Posts (4 tests)
- ✅ Events (4 tests)
- ✅ Sermons (4 tests)
- ✅ Books (4 tests)
- ✅ Podcasts (4 tests)
- ✅ Small Groups (4 tests)
- ✅ Resources (4 tests)
- ✅ Community Posts (4 tests)
- ✅ Conversations (2 tests)
- ✅ Users (2 tests)
- ✅ Admin (4 tests)

### Pages (30+ tests)
- ✅ Public pages (5 tests)
- ✅ Authenticated pages (6 tests)
- ✅ Tenant pages (11 tests)
- ✅ Admin pages (1 test)

### Features (15+ tests)
- ✅ Authentication flow (3 tests)
- ✅ Tenant creation (1 test)
- ✅ Membership flow (2 tests)
- ✅ Content creation (3 tests)
- ✅ Permissions (1 test)

## 🎓 Learning Path

**Complete Beginner:**
1. Run `setup.bat` to initialize
2. Read [README.md](README.md) for quick start
3. Run your first test: `npm run test:all`
4. View results in text report
5. Try the dashboard for visual view

**Daily User:**
1. Keep [QUICK-REFERENCE.md](QUICK-REFERENCE.md) handy
2. Run tests before commits
3. Fix issues systematically
4. Track progress over time

**Advanced User:**
1. Read [DOCUMENTATION.md](DOCUMENTATION.md) fully
2. Understand architecture from [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
3. Customize `test-config.ts`
4. Add custom tests
5. Integrate with CI/CD

## 🔧 Customization

### Add New Test User
Edit `test-config.ts`:
```typescript
testUsers: {
  myUser: {
    email: 'myuser@test.com',
    password: 'MyPassword123!',
  },
}
```

### Add New API Endpoint Test
Edit `test-config.ts` and `api-tests.ts` (see DOCUMENTATION.md for details)

### Add New Page Test
Edit `test-config.ts`:
```typescript
pages: {
  myPages: [
    { path: '/my-page', name: 'My Page' },
  ],
}
```

### Add New Feature Test
Edit `feature-tests.ts` (see examples in the file)

## 📈 Success Metrics

**After running tests, aim for:**
- ✅ 100% passed (0 failures, 0 errors)
- ✅ < 60 seconds total duration
- ✅ All critical paths covered
- ✅ Clear error messages for any failures

**Example successful run:**
```
SUMMARY
Total Tests: 142
✓ Passed:    142
✗ Failed:    0
⚠ Errors:    0
⊘ Skipped:   0
Duration:    45.32s
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Server not available" | Run `npm run dev` in another terminal |
| "Database errors" | Run `npm run db:seed` |
| "Timeout errors" | Increase timeouts in `test-config.ts` |
| "Module not found" | Run `npm install` |
| "No test results" | Run tests first: `npm run test:all` |

## 🎯 Best Practices

1. ✅ Run tests before committing code
2. ✅ Fix errors before failures
3. ✅ Test locally before pushing
4. ✅ Review issues file for tracking
5. ✅ Keep test data separate from production
6. ✅ Document any test changes
7. ✅ Re-run tests after fixes

## 📞 Support

**Need help?**
1. Check this index for the right document
2. Read the relevant documentation
3. Review test code for examples
4. Check server logs for errors
5. Search documentation for keywords

## 🎉 Quick Reference Card

**Most Common Commands:**
```bash
npm run test:all              # Run all tests
npm run test:api              # API tests only
npm run test:pages            # Page tests only
npm run test:features         # Feature tests only
notepad test-results\*.txt    # View latest report
powershell .\test-suite\view-results.ps1  # Interactive viewer
```

**Most Common Files:**
- `test-results/test-report-*.txt` ← Read this first
- `test-results/test-issues-*.json` ← Fix these
- `test-suite/QUICK-REFERENCE.md` ← Daily reference
- `test-suite/dashboard.html` ← Visual view

## 🗺️ File Map

```
Temple4/
├── test-suite/
│   ├── INDEX.md ⭐ (You are here)
│   ├── README.md ⭐ (Start here if new)
│   ├── QUICK-REFERENCE.md ⭐ (Daily use)
│   ├── DOCUMENTATION.md (Complete guide)
│   ├── IMPLEMENTATION-SUMMARY.md (Architecture)
│   │
│   ├── setup.bat ⭐ (First time setup)
│   ├── run-tests.bat ⭐ (Run tests)
│   ├── view-results.ps1 ⭐ (View results)
│   ├── dashboard.html ⭐ (Visual viewer)
│   │
│   ├── run-tests.ts (Main runner)
│   ├── api-tests.ts (API tests)
│   ├── page-tests.ts (Page tests)
│   ├── feature-tests.ts (Feature tests)
│   ├── test-config.ts (Configuration)
│   └── test-logger.ts (Logging)
│
└── test-results/ (Created after first run)
    ├── test-report-*.txt ⭐
    ├── test-issues-*.json ⭐
    ├── test-summary-*.json
    └── test-results-*.json
```

⭐ = Most frequently used

---

## 🎬 Next Steps

**If this is your first time:**
1. Run `cd test-suite && setup.bat`
2. Start server: `npm run dev` (in another terminal)
3. Run tests: `npm run test:all`
4. View report: `notepad test-results\test-report-*.txt`
5. Read [README.md](README.md) for more details

**If you're ready to test:**
```bash
npm run test:all
```

**If you need help:**
Check the appropriate document:
- Quick answer → [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- Detailed info → [DOCUMENTATION.md](DOCUMENTATION.md)
- Understanding system → [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)

---

**Happy Testing! 🎉**

Last Updated: November 17, 2025
