# Temple Platform Test Suite - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start server (in one terminal)
npm run dev

# 2. Run all tests (in another terminal)
npm run test:all

# 3. View results
notepad test-results\test-report-*.txt
```

## 📝 Commands

| Command | Description |
|---------|-------------|
| `npm run test:all` | Run all tests (API + Pages + Features) |
| `npm run test:api` | Run API endpoint tests only |
| `npm run test:pages` | Run page loading tests only |
| `npm run test:features` | Run feature workflow tests only |
| `test-suite\run-tests.bat` | Windows quick-start (checks everything) |

## 📊 Result Files

| File | Contains |
|------|----------|
| `test-report-*.txt` | **READ THIS FIRST** - Human-readable report |
| `test-issues-*.json` | Only failures and errors (for fixing) |
| `test-summary-*.json` | Statistics summary |
| `test-results-*.json` | All test details (for dashboard) |

## 🎯 Test Status Icons

| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | PASS | Test passed successfully |
| ✗ | FAIL | Test failed (wrong behavior) |
| ⚠ | ERROR | Test threw an exception |
| ⊘ | SKIP | Test skipped (missing data) |

## 🔍 HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success - no action |
| 201 | Created | Success - no action |
| 400 | Bad Request | Check request data format |
| 401 | Unauthorized | Check authentication |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check URL/route exists |
| 500 | Server Error | **Fix this first!** Check server logs |

## 🛠️ Fixing Issues - Workflow

```
1. Review Report
   ↓
2. Group Similar Issues
   ↓
3. Fix Priority Order:
   - 🔴 500 errors (server bugs)
   - 🟡 401/403 (auth issues)
   - 🟢 Individual endpoints
   - 🔵 Edge cases
   ↓
4. Fix One Issue
   ↓
5. Re-run Tests
   ↓
6. Verify Fix
   ↓
7. Repeat
```

## 📂 File Structure

```
test-suite/
├── run-tests.ts          # Main test runner
├── test-config.ts        # Configuration
├── test-logger.ts        # Results logging
├── api-tests.ts          # API endpoint tests
├── page-tests.ts         # Page loading tests
├── feature-tests.ts      # Feature workflow tests
├── dashboard.html        # Visual results viewer
├── README.md             # Setup guide
├── DOCUMENTATION.md      # Full documentation
└── run-tests.bat         # Windows launcher
```

## 🎨 Using Dashboard

1. Run tests: `npm run test:all`
2. Open `test-suite/dashboard.html` in browser
3. Click "📁 Load Test Results"
4. Select `test-results/test-results-*.json`
5. Use filters and search to explore results

## 🔧 Configuration

Edit `test-suite/test-config.ts`:

```typescript
export const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  
  testUsers: {
    admin: {
      email: 'admin@test.com',
      password: 'Admin123!@#',
    },
  },
  
  timeouts: {
    pageLoad: 30000,
    apiCall: 10000,
  },
};
```

## ⚡ Test Categories

### API Tests (95+ endpoints)
- Authentication (register, login, reset password)
- Tenants (CRUD)
- Members (join, list, manage)
- Content (posts, events, sermons, books, podcasts)
- Small Groups (CRUD)
- Resources (CRUD)
- Community Posts (CRUD)
- Conversations (messaging)
- Admin (settings, branding, audit logs)
- Users (profiles)

### Page Tests (30+ pages)
- Public (landing, login, register)
- Authenticated (explore, messages, notifications, account)
- Tenant (home, posts, events, sermons, etc.)
- Admin (console)

### Feature Tests (15+ workflows)
- Authentication flow
- Tenant creation flow
- Membership flow
- Content creation flow
- Permissions flow

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Server not available" | Run `npm run dev` |
| "Database errors" | Run `npm run db:seed` |
| "Timeout errors" | Increase timeouts in config |
| "Module not found" | Run `npm install` |
| "Test failures" | Check `test-issues-*.json` |

## 📖 Example: Reading a Failure

```
✗ FAIL: POST /api/auth/login (123ms)
  Error: Unexpected status code: 500 (expected: 200)
  Details: {"body": "Internal Server Error"}
```

**What this means:**
- Endpoint: POST /api/auth/login
- Response time: 123ms
- Expected: 200 OK
- Got: 500 Internal Server Error
- **Action:** Check server console for error details, fix bug in login route

## 🎯 Priority Levels

Fix in this order:

1. **🔴 CRITICAL** - 500 errors (blocks everything)
2. **🟠 HIGH** - Auth failures (affects most features)
3. **🟡 MEDIUM** - Individual endpoint failures
4. **🟢 LOW** - Edge cases, nice-to-haves

## 📈 Success Metrics

After fixing issues, you should see:

```
SUMMARY
--------------------------------------------------------------------------------
Total Tests: 142
✓ Passed:    142  ← Goal: 100%
✗ Failed:    0    ← Goal: 0
⚠ Errors:    0    ← Goal: 0
⊘ Skipped:   0    ← Goal: minimize
```

## 🎬 Next Steps

1. **Run tests:** `npm run test:all`
2. **Read report:** `test-results/test-report-*.txt`
3. **Fix issues** one category at a time
4. **Re-run tests** to verify
5. **Repeat** until all pass

## 📞 Need Help?

1. Read full documentation: `test-suite/DOCUMENTATION.md`
2. Check test configuration: `test-suite/test-config.ts`
3. Review test code for examples
4. Check server logs for backend errors

---

**Happy Testing! 🎉**

Run `npm run test:all` now to discover all issues in your application!
