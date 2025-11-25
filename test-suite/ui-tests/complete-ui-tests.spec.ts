import { test, expect } from '@playwright/test';
import { UITestBase, UserRole, PageTestResult } from './ui-test-base';
import { ErrorBacklogManager } from './error-backlog';
import fs from 'fs';
import path from 'path';
import { fetchTestResourceIds } from './test-data';

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
    ,
    // Facilities and related pages (detail pages are handled by dedicated flow tests below)
    '/tenants/[tenantId]/facilities',
    '/tenants/[tenantId]/photos',
    '/tenants/[tenantId]/services',
    '/tenants/[tenantId]/calendar/new'
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

    // Discover app routes and augment PAGES_TO_TEST so tests stay in sync
    try {
      const fs = require('fs');
      const path = require('path');
      const appDir = path.join(__dirname, '..', '..', 'app');

      const toRoute = (filePath: string) => {
        // Convert file path like app/tenants/[tenantId]/facilities/page.tsx to route
        const rel = path.relative(appDir, filePath).replace(/\\/g, '/');
        if (!rel.endsWith('/page.tsx')) return null;
        const route = '/' + rel.replace('/page.tsx', '');
        return route === '/index' ? '/' : route;
      };

      const discovered: string[] = [];

      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.isFile() && e.name === 'page.tsx') {
            const r = toRoute(full);
            if (r) discovered.push(r);
          }
        }
      };

      walk(appDir);

      // Simple heuristic: classify discovered routes and add if missing
      for (const r of discovered) {
        if (PAGES_TO_TEST.public.includes(r) || PAGES_TO_TEST.authenticated.includes(r) || PAGES_TO_TEST.tenant.includes(r) || PAGES_TO_TEST.admin.includes(r)) continue;

        if (r.startsWith('/admin')) {
          PAGES_TO_TEST.admin.push(r);
        } else if (r.startsWith('/auth') || r === '/' || r.startsWith('/explore') || r.startsWith('/docs')) {
          PAGES_TO_TEST.public.push(r);
        } else if (r.startsWith('/tenants')) {
          PAGES_TO_TEST.tenant.push(r);
        } else {
          PAGES_TO_TEST.authenticated.push(r);
        }
      }

      console.log('Discovered routes added to test lists:', discovered.length);

      // Replace parameter placeholders with concrete seeded IDs when available.
      try {
        const ids = await fetchTestResourceIds(TEST_TENANT_ID);

        const replaceTokensInList = (list: string[]) => {
          return list.map((p) =>
            p.replace(/\[tenantId\]/g, TEST_TENANT_ID)
             .replace(/\[facilityId\]/g, ids.facilityId ?? '[facilityId]')
             .replace(/\[serviceId\]/g, ids.serviceId ?? '[serviceId]')
          );
        };

        PAGES_TO_TEST.public = replaceTokensInList(PAGES_TO_TEST.public);
        PAGES_TO_TEST.authenticated = replaceTokensInList(PAGES_TO_TEST.authenticated);
        PAGES_TO_TEST.tenant = replaceTokensInList(PAGES_TO_TEST.tenant);
        PAGES_TO_TEST.admin = replaceTokensInList(PAGES_TO_TEST.admin);

        console.log('Replaced placeholder tokens with seeded resource ids:', ids);
      } catch (e: unknown) {
        const err = e as any;
        console.warn('Failed to fetch test resource ids:', err?.message ?? err);
      }
    } catch (e: unknown) {
      const err = e as any;
      console.warn('Failed to auto-discover app pages for testing:', err?.message ?? err);
    }
  });

  // Dedicated facility flow tests (click into first facility and exercise reserve/manage flows)
  test('Facility flow as TENANT_ADMIN', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const admin = users[UserRole.TENANT_ADMIN];

    const loggedIn = await tester.loginAs(admin);
    if (!loggedIn) {
      console.log('Failed to login as tenant admin, skipping facility flow test');
      return;
    }

    const listUrl = `/tenants/${TEST_TENANT_ID}/facilities`;
    console.log(`\nOpening facilities list: ${listUrl}`);
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Try to find a facility link and click into it
    const facilityLink = page.locator(`a[href*="/tenants/${TEST_TENANT_ID}/facilities/"]`).first();
    if ((await facilityLink.count()) === 0) {
      console.log('No facility links found on list page');
      return;
    }

    await facilityLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Attempt to reserve/book using common button texts
    const reserveButton = page.locator('button:has-text("Reserve"), button:has-text("Book"), button:has-text("Request")').first();
    if (await reserveButton.isVisible().catch(() => false)) {
      try {
        await reserveButton.click({ timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        const hasDialog = await page.locator('[role="dialog"], .modal, [aria-modal="true"]').isVisible().catch(() => false);
        console.log('Reserve action result - dialog visible:', hasDialog);
      } catch (e: unknown) {
        const err = e as any;
        console.warn('Failed to click reserve button:', err?.message ?? err);
      }
    } else {
      console.log('No reserve/book button visible on facility detail');
    }

    // Check settings -> manage facilities link exists for admin
    const settingsUrl = `/tenants/${TEST_TENANT_ID}/settings`;
    await page.goto(settingsUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const manageLink = page.locator('a:has-text("Facilities"), button:has-text("Manage Facilities"), a:has-text("Manage Facilities")').first();
    const canManage = await manageLink.isVisible().catch(() => false);
    console.log('Manage facilities link visible in settings (admin):', canManage);
  });

  test('Facility flow as USER', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];

    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) {
      console.log('Failed to login as user, skipping facility flow test');
      return;
    }

    const listUrl = `/tenants/${TEST_TENANT_ID}/facilities`;
    console.log(`\nOpening facilities list: ${listUrl}`);
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const facilityLink = page.locator(`a[href*="/tenants/${TEST_TENANT_ID}/facilities/"]`).first();
    if ((await facilityLink.count()) === 0) {
      console.log('No facility links found on list page (user)');
      return;
    }

    await facilityLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Attempt to reserve/book as regular user
    const reserveButton = page.locator('button:has-text("Reserve"), button:has-text("Book"), button:has-text("Request")').first();
    if (await reserveButton.isVisible().catch(() => false)) {
      try {
        await reserveButton.click({ timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        const hasDialog = await page.locator('[role="dialog"], .modal, [aria-modal="true"]').isVisible().catch(() => false);
        console.log('Reserve action result (user) - dialog visible:', hasDialog);
      } catch (e: unknown) {
        const err = e as any;
        console.warn('Failed to click reserve button (user):', err?.message ?? err);
      }
    } else {
      console.log('No reserve/book button visible on facility detail (user)');
    }
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
      // Check whether the visitor has access first; skip pages that redirect/require auth
      const access = await tester.checkAccess(url);
      if (!access.hasAccess) {
        console.log(`  Skipping ${url} as ${visitor.role} (no access: ${access.reason || 'restricted'})`);
        continue;
      }

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
