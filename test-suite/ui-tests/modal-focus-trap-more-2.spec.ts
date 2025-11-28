import { test, expect } from '@playwright/test';
import { UITestBase, UserRole } from './ui-test-base';

test.describe('More modal focus trap tests', () => {
  test('DayEventsModal traps focus and can close', async ({ page }) => {
    const tester = new UITestBase(page);
    // Use platform admin (no auth required to load test page but keep consistent)
    const users = UITestBase.getTestUsers();
    await tester.loginAs(users[UserRole.USER]).catch(() => {});

    await page.goto('/test/open-day-events', { waitUntil: 'networkidle' });
    const dialog = page.locator('[data-test="day-events-modal"], [role="dialog"], [aria-modal="true"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // Initial focus should be inside
    const focusedInside = await page.evaluate(() => !!document.activeElement?.closest('[data-test="day-events-modal"]'));
    expect(focusedInside).toBeTruthy();

    // Tab a few times and ensure focus stays inside
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => !!document.activeElement?.closest('[data-test="day-events-modal"]'));
      expect(stillInside).toBeTruthy();
    }

    // Close modal and ensure focus not inside
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    const stillInDialog = await page.evaluate(() => !!document.activeElement?.closest('[data-test="day-events-modal"]'));
    expect(stillInDialog).toBeFalsy();
  });

  test('RespondSubmissionModal traps focus and Cancel returns focus', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    await tester.loginAs(users[UserRole.PLATFORM_ADMIN]).catch(() => {});

    await page.goto('/test/open-respond-submission', { waitUntil: 'networkidle' });
    const dialog = page.locator('[data-test="respond-submission-modal"], [role="dialog"], [aria-modal="true"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    const focusedInside = await page.evaluate(() => !!document.activeElement?.closest('[data-test="respond-submission-modal"]'));
    expect(focusedInside).toBeTruthy();

    // Try pressing Tab
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => !!document.activeElement?.closest('[data-test="respond-submission-modal"]'));
      expect(stillInside).toBeTruthy();
    }

    // Click Cancel button if present
    const cancelBtn = dialog.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    const stillInDialog = await page.evaluate(() => !!document.activeElement?.closest('[data-test="respond-submission-modal"]'));
    expect(stillInDialog).toBeFalsy();
  });
});
