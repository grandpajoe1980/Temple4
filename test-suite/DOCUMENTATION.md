# Temple Platform - Complete Test Suite Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Suite Architecture](#test-suite-architecture)
4. [Running Tests](#running-tests)
5. [Understanding Results](#understanding-results)
6. [Fixing Issues Systematically](#fixing-issues-systematically)
7. [Test Coverage](#test-coverage)
8. [Advanced Usage](#advanced-usage)

---

## Overview

This comprehensive test suite automatically tests **every feature, page, and API endpoint** in the Temple Platform. It systematically identifies all issues and generates detailed logs for systematic fixing.

### What Gets Tested

✅ **95+ API Endpoints** - All CRUD operations, authentication, authorization
✅ **30+ Pages** - Public, authenticated, tenant, and admin pages  
✅ **15+ Features** - Complete user workflows from registration to content creation
✅ **Error Detection** - Catches runtime errors, server errors, and edge cases
✅ **Performance** - Tracks response times for all operations

### Output

The test suite generates:
- 📊 **Human-readable report** (`test-report-*.txt`) - Easy to read summary
- 📈 **JSON summary** (`test-summary-*.json`) - Statistics and metrics
- 🔍 **Detailed results** (`test-results-*.json`) - Every test with full details
- ⚠️ **Issues only** (`test-issues-*.json`) - Just failures and errors
- 🌐 **Interactive dashboard** (`dashboard.html`) - Visual interface

---

## Quick Start

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure database is seeded:**
   ```bash
   npm run db:seed
   ```

### Run All Tests

**Windows:**
```bash
test-suite\run-tests.bat
```

**Command Line:**
```bash
npm run test:all
```

**That's it!** Results will be saved in `test-results/` folder.

---

## Test Suite Architecture

```
test-suite/
├── run-tests.ts          # Main orchestrator
├── test-config.ts        # Configuration and test data
├── test-logger.ts        # Logging and report generation
├── api-tests.ts          # API endpoint tests
├── page-tests.ts         # Page loading tests
├── feature-tests.ts      # Feature workflow tests
├── dashboard.html        # Visual results dashboard
├── README.md             # Documentation
└── run-tests.bat         # Windows quick-start script
```

### Test Flow

```
1. Check Server Availability
   ↓
2. Run Feature Tests (creates test data)
   ↓
3. Run API Tests (tests all endpoints)
   ↓
4. Run Page Tests (tests all pages)
   ↓
5. Generate Reports
   ↓
6. Save Results
```

---

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites

**API Tests Only:**
```bash
npm run test:api
```

**Page Tests Only:**
```bash
npm run test:pages
```

**Feature Tests Only:**
```bash
npm run test:features
```

### Windows Batch Script
```bash
cd test-suite
run-tests.bat
```
This script:
- Checks Node.js installation
- Installs dependencies if needed
- Seeds database if needed
- Checks if server is running
- Runs all tests
- Shows results location

---

## Understanding Results

### File Structure

After running tests, you'll find in `test-results/`:

```
test-results/
├── test-report-2025-11-17-12-30-45.txt      ← Read this first!
├── test-summary-2025-11-17-12-30-45.json
├── test-results-2025-11-17-12-30-45.json
└── test-issues-2025-11-17-12-30-45.json     ← Issues to fix
```

### Reading the Report

**Open `test-report-*.txt` in any text editor:**

```
================================================================================
TEMPLE PLATFORM - COMPREHENSIVE TEST REPORT
================================================================================

Generated: 11/17/2025, 12:30:45 PM
Total Duration: 45.32s

SUMMARY
--------------------------------------------------------------------------------
Total Tests: 142
✓ Passed:    98
✗ Failed:    32
⚠ Errors:    10
⊘ Skipped:   2

API - AUTHENTICATION
--------------------------------------------------------------------------------
✓ PASS: POST /api/auth/register (234ms)
✗ FAIL: POST /api/auth/login (123ms)
  Error: Unexpected status code: 500 (expected: 200)
⚠ ERROR: GET /api/auth/me (45ms)
  Error: Connection refused
...

================================================================================
ISSUES THAT NEED FIXING
================================================================================

1. [FAIL] API - Authentication - POST /api/auth/login
   Unexpected status code: 500 (expected: 200)
   Details: {"body": "Internal Server Error", "contentType": "text/html"}

2. [ERROR] API - Tenants - POST /api/tenants
   TypeError: Cannot read property 'id' of undefined
   Details: {...}
...
```

### Status Meanings

| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | **PASS** | Test passed successfully |
| ✗ | **FAIL** | Test failed (wrong behavior) |
| ⚠ | **ERROR** | Test threw an exception |
| ⊘ | **SKIP** | Test skipped (missing prereqs) |

### Common Status Codes

| Code | Meaning | Usually Indicates |
|------|---------|-------------------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Bug in server code |

---

## Fixing Issues Systematically

### Step-by-Step Process

#### 1. Review the Report
```bash
# Open the readable report
notepad test-results\test-report-[timestamp].txt
```

#### 2. Group Similar Issues
Look for patterns:
- Same error message across multiple tests
- Same status code (e.g., all 500 errors)
- Same category (e.g., all API tests failing)

#### 3. Prioritize

**Fix in this order:**
1. 🔴 **Server errors (500)** - These block everything
2. 🟡 **Authentication issues** - These affect all authenticated features
3. 🟢 **Individual endpoints** - One at a time
4. 🔵 **Edge cases** - After main functionality works

#### 4. Fix One Category at a Time

**Example: Fixing Authentication**

The report shows:
```
✗ FAIL: POST /api/auth/login
  Error: Unexpected status code: 500
```

**Steps:**
1. Open the file: `app/api/auth/login/route.ts`
2. Look for the error (check server console)
3. Fix the bug
4. Test just that endpoint:
   ```bash
   # Manually test
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```
5. Re-run full test suite
6. Verify the fix: `npm run test:all`

#### 5. Use the Issues File

```bash
# View only failures and errors
code test-results\test-issues-[timestamp].json
```

This file contains ONLY the tests that failed, making it easier to track what needs fixing.

#### 6. Track Progress

Create a checklist:
```
## Issues to Fix

### Authentication (5 issues)
- [ ] POST /api/auth/login - 500 error
- [ ] GET /api/auth/me - connection refused
- [x] POST /api/auth/register - fixed!
...

### Tenants (3 issues)
- [ ] POST /api/tenants - undefined ID
...
```

---

## Test Coverage

### API Endpoints (95+ tests)

#### Authentication
- ✓ POST /api/auth/register
- ✓ POST /api/auth/login
- ✓ GET /api/auth/me
- ✓ POST /api/auth/forgot-password
- ✓ POST /api/auth/reset-password

#### Tenants
- ✓ GET /api/tenants
- ✓ POST /api/tenants
- ✓ GET /api/tenants/[tenantId]
- ✓ PUT /api/tenants/[tenantId]
- ✓ DELETE /api/tenants/[tenantId]

#### Members
- ✓ GET /api/tenants/[tenantId]/members
- ✓ POST /api/tenants/[tenantId]/join
- ✓ PUT /api/tenants/[tenantId]/members/[userId]
- ✓ DELETE /api/tenants/[tenantId]/members/[userId]

#### Content (Posts, Events, Sermons, Books, Podcasts)
- ✓ GET /api/tenants/[tenantId]/posts
- ✓ POST /api/tenants/[tenantId]/posts
- ✓ PUT /api/tenants/[tenantId]/posts/[postId]
- ✓ DELETE /api/tenants/[tenantId]/posts/[postId]
- ✓ ... (same for events, sermons, books, etc.)

#### Small Groups
- ✓ GET /api/tenants/[tenantId]/small-groups
- ✓ POST /api/tenants/[tenantId]/small-groups
- ✓ ... (CRUD operations)

#### Resources
- ✓ GET /api/tenants/[tenantId]/resources
- ✓ POST /api/tenants/[tenantId]/resources
- ✓ ... (CRUD operations)

#### Community Posts
- ✓ GET /api/tenants/[tenantId]/community-posts
- ✓ POST /api/tenants/[tenantId]/community-posts
- ✓ ... (CRUD operations)

#### Conversations
- ✓ GET /api/conversations
- ✓ POST /api/conversations/direct

#### Admin
- ✓ GET /api/tenants/[tenantId]/admin/settings
- ✓ PUT /api/tenants/[tenantId]/admin/settings
- ✓ GET /api/tenants/[tenantId]/admin/branding
- ✓ GET /api/tenants/[tenantId]/admin/audit-logs
- ✓ GET /api/tenants/[tenantId]/admin/contact-submissions

### Pages (30+ tests)

#### Public Pages
- ✓ / (Landing Page)
- ✓ /auth/login
- ✓ /auth/register
- ✓ /auth/forgot-password
- ✓ /auth/reset-password

#### Authenticated Pages
- ✓ /explore
- ✓ /messages
- ✓ /notifications
- ✓ /account
- ✓ /profile/[userId]
- ✓ /tenants/new

#### Tenant Pages
- ✓ /tenants/[tenantId]
- ✓ /tenants/[tenantId]/posts
- ✓ /tenants/[tenantId]/events
- ✓ /tenants/[tenantId]/sermons
- ✓ /tenants/[tenantId]/books
- ✓ /tenants/[tenantId]/small-groups
- ✓ /tenants/[tenantId]/donations
- ✓ /tenants/[tenantId]/volunteering
- ✓ /tenants/[tenantId]/members
- ✓ /tenants/[tenantId]/contact
- ✓ /tenants/[tenantId]/control-panel

#### Admin Pages
- ✓ /admin

### Features (15+ tests)

#### Authentication Flow
- ✓ User Registration
- ✓ User Login
- ✓ Session Persistence

#### Tenant Creation Flow
- ✓ Create New Tenant

#### Membership Flow
- ✓ Join Tenant
- ✓ View Members

#### Content Creation Flow
- ✓ Create Post
- ✓ Create Event
- ✓ Create Sermon

#### Permissions Flow
- ✓ Admin Access Control

---

## Advanced Usage

### Customizing Test Configuration

Edit `test-suite/test-config.ts`:

```typescript
export const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',  // Change for production
  
  testUsers: {
    admin: {
      email: 'admin@test.com',       // Your test admin
      password: 'Admin123!@#',
    },
    // ... add more test users
  },
  
  timeouts: {
    pageLoad: 30000,                 // Increase for slow connections
    apiCall: 10000,
  },
};
```

### Adding New Tests

#### Add API Endpoint Test

1. Edit `test-suite/test-config.ts`:
```typescript
apiEndpoints: {
  myNewEndpoint: [
    { method: 'GET', path: '/my-endpoint', requiresAuth: true },
  ],
}
```

2. Edit `test-suite/api-tests.ts`:
```typescript
private async testMyNewEndpoints() {
  const category = 'API - My Feature';
  
  await this.testEndpoint(
    category,
    'GET /api/my-endpoint',
    async () => {
      const response = await fetch(
        `${TEST_CONFIG.apiBaseUrl}/my-endpoint`,
        { method: 'GET', headers: this.getAuthHeaders() }
      );
      return { response, expectedStatus: [200] };
    }
  );
}
```

#### Add Page Test

1. Edit `test-suite/test-config.ts`:
```typescript
pages: {
  myPages: [
    { path: '/my-page', name: 'My Page' },
  ],
}
```

#### Add Feature Test

Edit `test-suite/feature-tests.ts`:
```typescript
private async testMyFeature() {
  const category = 'Feature - My Feature';
  
  this.logger.startTest(category, 'My Test Name');
  try {
    // Your test code here
    this.logger.logPass(category, 'My Test Name', { details });
  } catch (error) {
    this.logger.logError(category, 'My Test Name', error);
  }
}
```

### Viewing Results in Dashboard

1. Run tests: `npm run test:all`
2. Open `test-suite/dashboard.html` in browser
3. Click "Load Test Results"
4. Select `test-results/test-results-[timestamp].json`
5. View interactive dashboard with filters and search

### Integration with CI/CD

**GitHub Actions:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run db:seed
      - run: npm run dev &
      - run: sleep 10
      - run: npm run test:all
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Debugging Failed Tests

**Enable verbose logging:**
```typescript
// In test-logger.ts, add to logFail():
console.log('Full response:', JSON.stringify(details, null, 2));
```

**Test individual endpoint manually:**
```bash
# Using curl
curl -v http://localhost:3000/api/auth/me

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/me" -Method GET
```

**Check server logs:**
Look at the terminal where `npm run dev` is running for error details.

---

## Troubleshooting

### "Server is not available"
**Solution:** Start the dev server in another terminal:
```bash
npm run dev
```

### "Database errors"
**Solution:** Reset the database:
```bash
npm run db:seed
```

### "Timeout errors"
**Solution:** Increase timeouts in `test-config.ts`:
```typescript
timeouts: {
  pageLoad: 60000,  // 60 seconds
  apiCall: 20000,   // 20 seconds
}
```

### "Authentication failures"
**Solution:** Verify test user exists in database or create via register endpoint first.

### "Cannot find module"
**Solution:** Install dependencies:
```bash
npm install
```

---

## Best Practices

1. **Run tests after every major change**
2. **Fix errors before failures** - Errors indicate bugs, failures indicate issues
3. **Test locally before committing** - Catch issues early
4. **Review issues file** - Focus on what's broken
5. **Track progress** - Use a checklist or project board
6. **Re-run after fixes** - Verify your fixes work
7. **Keep test data separate** - Don't use production data

---

## Support & Contributing

### Getting Help
1. Check this documentation
2. Review test reports for error details
3. Check server logs for backend errors
4. Review test code to understand what's being tested

### Contributing New Tests
1. Follow existing patterns in test files
2. Add configuration to `test-config.ts`
3. Document what the test does
4. Test your test! (Make sure it catches real issues)

---

## Summary

This test suite provides:
- ✅ **Complete coverage** of all features and pages
- ✅ **Automated testing** - No manual clicking
- ✅ **Detailed reports** - Know exactly what's wrong
- ✅ **Issue tracking** - Systematic fixing process
- ✅ **Progress monitoring** - See improvements over time

**Start testing now:**
```bash
npm run test:all
```

Then open `test-results/test-report-[timestamp].txt` to see all issues that need fixing!
