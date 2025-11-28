import { test } from '@playwright/test';
import { UITestBase, UserRole } from './ui-test-base';

test('debug messages page DOM', async ({ page }) => {
  const tester = new UITestBase(page);
  const users = UITestBase.getTestUsers();
  const user = users[UserRole.USER];

  const loggedIn = await tester.loginAs(user);
  if (!loggedIn) {
    test.skip();
  }

  await page.goto('/messages', { waitUntil: 'networkidle' });

  // Capture client console messages to surface runtime errors
  page.on('console', (msg) => {
    try {
      console.log('PAGE LOG>', msg.type(), msg.text());
    } catch (e) {}
  });

  // Dump a portion of the page content to help debug test selector issues
  const headerHtml = await page.locator('header').first().innerHTML().catch(() => 'HEADER_NOT_FOUND');
  const bodyHtml = await page.locator('main, body').first().innerHTML().catch(() => 'BODY_NOT_FOUND');

  const triggerCount = await page.locator('[data-test="new-message-trigger"], button:has-text("+ New Message"), button:has-text("New Message")').count();
  console.log('New Message trigger count:', triggerCount);

  // Also check whether the modal can be opened via test query param
  await page.goto('/messages?openNewMessageModal=1', { waitUntil: 'networkidle' });
  const modalAttached = await page.locator('[data-test="new-message-modal"], [data-test="new-message-modal-overlay"], [role="dialog"], [aria-modal="true"]').count();
  const href = await page.evaluate(() => window.location.href).catch(() => 'no-href');
  const search = await page.evaluate(() => window.location.search).catch(() => 'no-search');
  console.log('location.href:', href);
  console.log('location.search:', search);
  console.log('Modal present when opened via query param (count):', modalAttached);

  console.log('--- HEADER HTML ---');
  console.log(headerHtml.slice(0, 2000));
  console.log('--- BODY HTML (first 2000 chars) ---');
  console.log(bodyHtml.slice(0, 2000));

});
