import { test, expect } from '@playwright/test';
import { UITestBase, UserRole, PageTestResult } from './ui-test-base';
import { ErrorBacklogManager } from './error-backlog';
import fs from 'fs';
import path from 'path';

/**
 * Pages to test - organized by access level
 */
const PAGES_TO_TEST = {
  public: [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/explore'
  ],
  authenticated: [
    '/messages',
    '/notifications',
    '/account',
    '/tenants/new'
  ],
  tenant: [
    '/tenants/[tenantId]',
    '/tenants/[tenantId]/posts',
    '/tenants/[tenantId]/calendar',
    '/tenants/[tenantId]/sermons',
    '/tenants/[tenantId]/podcasts',
    '/tenants/[tenantId]/books',
    '/tenants/[tenantId]/members',
    '/tenants/[tenantId]/chat',
    '/tenants/[tenantId]/donations',
    '/tenants/[tenantId]/contact',
    '/tenants/[tenantId]/volunteering',
    '/tenants/[tenantId]/small-groups',
    '/tenants/[tenantId]/livestream',
    '/tenants/[tenantId]/prayer-wall',
    '/tenants/[tenantId]/resources',
    '/tenants/[tenantId]/settings'
  ],
  admin: [
    '/admin'
  ]
};

// Test tenant ID (from seed data)
const TEST_TENANT_ID = 'cmi3atear0014ums4fuftaa9r';

/**
 * Main UI Test Suite
 */
test.describe('Complete UI Test Suite', () => {
  let testResults: PageTestResult[] = [];
  let errorBacklog: ErrorBacklogManager;

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, '../../test-results/screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Initialize error backlog
    errorBacklog = new ErrorBacklogManager();
  });

  test.afterAll(async () => {
    // Save all results
    const resultsPath = path.join(__dirname, '../../test-results/ui-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nUI Test results saved to ${resultsPath}`);

    // Save error backlog
    errorBacklog.saveBacklog();
    errorBacklog.saveReport();

    // Print summary
    const summary = errorBacklog.getSummary();
    console.log('\n' + '='.repeat(80));
    console.log('UI TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Pages Tested: ${testResults.length}`);
    console.log(`Total Buttons Found: ${testResults.reduce((sum, r) => sum + r.buttonsFound, 0)}`);
    console.log(`Total Buttons Tested: ${testResults.reduce((sum, r) => sum + r.buttonsTested, 0)}`);
    console.log(`Buttons Working: ${testResults.reduce((sum, r) => sum + r.buttonsWorking, 0)}`);
    console.log(`Buttons Failing: ${testResults.reduce((sum, r) => sum + r.buttonsFailing, 0)}`);
    console.log('');
    console.log('ERRORS:');
    console.log(`  Total: ${summary.total}`);
    console.log(`  Critical: ${summary.bySeverity.CRITICAL}`);
    console.log(`  High: ${summary.bySeverity.HIGH}`);
    console.log(`  Medium: ${summary.bySeverity.MEDIUM}`);
    console.log(`  Low: ${summary.bySeverity.LOW}`);
    console.log('='.repeat(80));
  });

  // Test public pages as visitor
  test('Test public pages as VISITOR', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const visitor = users[UserRole.VISITOR];

    await tester.loginAs(visitor);

    for (const pagePath of PAGES_TO_TEST.public) {
      console.log(`\nTesting ${pagePath} as ${visitor.role}...`);
      const result = await tester.testPage(pagePath, visitor);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test public pages as standard user
  test('Test public pages as USER', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];

    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) {
      console.log('Failed to login as user, skipping user tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.public) {
      console.log(`\nTesting ${pagePath} as ${user.role}...`);
      const result = await tester.testPage(pagePath, user);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test authenticated pages as standard user
  test('Test authenticated pages as USER', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];

    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) {
      console.log('Failed to login as user, skipping authenticated tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.authenticated) {
      console.log(`\nTesting ${pagePath} as ${user.role}...`);
      const result = await tester.testPage(pagePath, user);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test authenticated pages as tenant admin
  test('Test authenticated pages as TENANT_ADMIN', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const admin = users[UserRole.TENANT_ADMIN];

    const loggedIn = await tester.loginAs(admin);
    if (!loggedIn) {
      console.log('Failed to login as tenant admin, skipping tenant admin tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.authenticated) {
      console.log(`\nTesting ${pagePath} as ${admin.role}...`);
      const result = await tester.testPage(pagePath, admin);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test tenant pages as visitor
  test('Test tenant pages as VISITOR', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const visitor = users[UserRole.VISITOR];

    await tester.loginAs(visitor);

    for (const pagePath of PAGES_TO_TEST.tenant) {
      const url = pagePath.replace('[tenantId]', TEST_TENANT_ID);
      console.log(`\nTesting ${url} as ${visitor.role}...`);
      const result = await tester.testPage(url, visitor);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test tenant pages as standard user
  test('Test tenant pages as USER', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];

    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) {
      console.log('Failed to login as user, skipping tenant page tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.tenant) {
      const url = pagePath.replace('[tenantId]', TEST_TENANT_ID);
      console.log(`\nTesting ${url} as ${user.role}...`);
      const result = await tester.testPage(url, user);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test tenant pages as tenant admin
  test('Test tenant pages as TENANT_ADMIN', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const admin = users[UserRole.TENANT_ADMIN];

    const loggedIn = await tester.loginAs(admin);
    if (!loggedIn) {
      console.log('Failed to login as tenant admin, skipping tenant admin page tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.tenant) {
      const url = pagePath.replace('[tenantId]', TEST_TENANT_ID);
      console.log(`\nTesting ${url} as ${admin.role}...`);
      const result = await tester.testPage(url, admin);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test tenant pages as platform admin
  test('Test tenant pages as PLATFORM_ADMIN', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const platformAdmin = users[UserRole.PLATFORM_ADMIN];

    const loggedIn = await tester.loginAs(platformAdmin);
    if (!loggedIn) {
      console.log('Failed to login as platform admin, skipping platform admin tenant tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.tenant) {
      const url = pagePath.replace('[tenantId]', TEST_TENANT_ID);
      console.log(`\nTesting ${url} as ${platformAdmin.role}...`);
      const result = await tester.testPage(url, platformAdmin);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test admin pages as platform admin
  test('Test admin pages as PLATFORM_ADMIN', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const platformAdmin = users[UserRole.PLATFORM_ADMIN];

    const loggedIn = await tester.loginAs(platformAdmin);
    if (!loggedIn) {
      console.log('Failed to login as platform admin, skipping admin page tests');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.admin) {
      console.log(`\nTesting ${pagePath} as ${platformAdmin.role}...`);
      const result = await tester.testPage(pagePath, platformAdmin);
      testResults.push(result);
      errorBacklog.addFromPageResult(result);
      
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Buttons: ${result.buttonsFound} found, ${result.buttonsWorking} working, ${result.buttonsFailing} failing`);
    }
  });

  // Test admin pages as visitor (should be denied)
  test('Test admin pages access control for VISITOR', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const visitor = users[UserRole.VISITOR];

    await tester.loginAs(visitor);

    for (const pagePath of PAGES_TO_TEST.admin) {
      console.log(`\nChecking ${pagePath} access as ${visitor.role}...`);
      const access = await tester.checkAccess(pagePath);
      console.log(`  Access: ${access.hasAccess} ${access.reason || ''}`);
      expect(access.hasAccess).toBe(false); // Visitor should not have access
    }
  });

  // Test admin pages access control for standard user (should be denied)
  test('Test admin pages access control for USER', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];

    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) {
      console.log('Failed to login as user, skipping access control test');
      return;
    }

    for (const pagePath of PAGES_TO_TEST.admin) {
      console.log(`\nChecking ${pagePath} access as ${user.role}...`);
      const access = await tester.checkAccess(pagePath);
      console.log(`  Access: ${access.hasAccess} ${access.reason || ''}`);
      expect(access.hasAccess).toBe(false); // Regular user should not have access
    }
  });
});
