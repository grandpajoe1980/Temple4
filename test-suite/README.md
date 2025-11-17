# Temple Platform Test Suite

Comprehensive automated test suite for testing all features, pages, and API endpoints.

## Overview

This test suite systematically tests:
- **API Endpoints**: All REST API endpoints including auth, tenants, content, etc.
- **Pages**: All public, authenticated, tenant, and admin pages
- **Features**: Complete user workflows (registration, login, tenant creation, etc.)
- **Error Detection**: Captures and logs all errors, failures, and issues

## Prerequisites

1. The development server must be running:
   ```bash
   npm run dev
   ```

2. Database must be set up and seeded:
   ```bash
   npm run db:seed
   ```

## Running the Tests

### Run all tests:
```bash
npm run test:all
```

Or manually:
```bash
npx ts-node test-suite/run-tests.ts
```

### Run specific test suites:

```bash
# API tests only
npx ts-node -e "import('./test-suite/api-tests').then(m => new m.APITestSuite(new (require('./test-suite/test-logger').TestLogger)()).runAllTests())"

# Page tests only
npx ts-node -e "import('./test-suite/page-tests').then(m => new m.PageTestSuite(new (require('./test-suite/test-logger').TestLogger)()).runAllTests())"

# Feature tests only
npx ts-node -e "import('./test-suite/feature-tests').then(m => new m.FeatureTestSuite(new (require('./test-suite/test-logger').TestLogger)()).runAllTests())"
```

## Test Results

After running tests, results are saved in the `test-results/` directory:

- **test-report-[timestamp].txt** - Human-readable report with all test results
- **test-summary-[timestamp].json** - JSON summary of pass/fail counts
- **test-results-[timestamp].json** - Detailed JSON of all test results
- **test-issues-[timestamp].json** - Only failed and errored tests

## Test Configuration

Edit `test-suite/test-config.ts` to customize:
- Base URLs
- Test user credentials
- Timeouts
- API endpoints to test
- Pages to test

## Test Categories

### 1. API Tests (`api-tests.ts`)
Tests all API endpoints:
- Authentication (register, login, logout, password reset)
- Tenants (CRUD operations)
- Members (join, list, update, remove)
- Content (posts, events, sermons, books, podcasts, etc.)
- Conversations and messaging
- User profiles
- Admin endpoints

### 2. Page Tests (`page-tests.ts`)
Tests all pages load correctly:
- Public pages (landing, login, register, etc.)
- Authenticated pages (explore, messages, notifications, account)
- Tenant pages (home, posts, events, sermons, books, etc.)
- Admin pages (console, settings)

### 3. Feature Tests (`feature-tests.ts`)
Tests complete user workflows:
- Authentication flow (register → login → session)
- Tenant creation flow
- Membership flow (join → view members)
- Content creation flow (posts, events, sermons)
- Permissions and access control

## Understanding Results

### Status Codes
- ✓ **PASS** - Test passed successfully
- ✗ **FAIL** - Test failed (unexpected behavior)
- ⚠ **ERROR** - Test encountered an error/exception
- ⊘ **SKIP** - Test was skipped (missing prerequisites)

### Common Issues

**401 Unauthorized**: Authentication required but not provided
**403 Forbidden**: User lacks permissions for the action
**404 Not Found**: Endpoint or resource doesn't exist
**500 Internal Server Error**: Server-side error occurred

## Fixing Issues Systematically

1. **Review the report**: Open `test-results/test-report-[timestamp].txt`
2. **Identify patterns**: Group similar failures together
3. **Check issues file**: Review `test-results/test-issues-[timestamp].json`
4. **Fix and verify**:
   - Fix the code
   - Re-run tests: `npm run test:all`
   - Verify the issue is resolved

## Adding New Tests

### Add API Endpoint Test
Edit `test-suite/test-config.ts` and add to `apiEndpoints`:
```typescript
myEndpoint: [
  { method: 'GET', path: '/my-endpoint', requiresAuth: true },
]
```

### Add Page Test
Edit `test-suite/test-config.ts` and add to `pages`:
```typescript
myPages: [
  { path: '/my-page', name: 'My Page' },
]
```

### Add Feature Test
Edit `test-suite/feature-tests.ts` and add a new test method:
```typescript
private async testMyFeature() {
  const category = 'Feature - My Feature';
  this.logger.startTest(category, 'Test Name');
  // ... test implementation
}
```

## Continuous Integration

This test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:all
```

## Troubleshooting

**Server not available**: Make sure `npm run dev` is running
**Database errors**: Run `npm run db:seed` to reset test data
**Timeout errors**: Increase timeouts in `test-config.ts`
**Authentication failures**: Check test user credentials in config

## Support

For issues or questions about the test suite:
1. Check the test report for detailed error messages
2. Review the test configuration
3. Ensure all prerequisites are met
4. Check that the server is running correctly
