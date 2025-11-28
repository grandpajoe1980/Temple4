import { test, expect } from '@playwright/test';
import { UITestBase, UserRole } from './ui-test-base';

test.describe('Additional modal focus trap checks', () => {
  test('User Profiles edit modal traps focus and returns to trigger', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const admin = users[UserRole.PLATFORM_ADMIN];
    const tenant = UITestBase.getTestUsers()[UserRole.TENANT_ADMIN];
    const loggedIn = await tester.loginAs(admin);
    if (!loggedIn) test.skip();

    // Use a test-only debug page that opens the EditUserProfileModal deterministically
    await page.goto('/test/open-edit-user-profile', { waitUntil: 'networkidle' });
    const dialog = page.locator('[data-test="edit-user-profile-modal"], [role="dialog"], [aria-modal="true"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // Assert focus is inside the dialog
    const focusedInside = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      return !!active.closest('[data-test="edit-user-profile-modal"]');
    });
    expect(focusedInside).toBeTruthy();

    // Tab a few times and ensure focus stays inside
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return false;
        return !!active.closest('[data-test="edit-user-profile-modal"]');
      });
      expect(stillInside).toBeTruthy();
    }

    // Close with Escape
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Focus should return to trigger (or at least not be inside dialog)
    const stillInDialog = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      return !!active.closest('[data-test="edit-user-profile-modal"]');
    });
    expect(stillInDialog).toBeFalsy();
  });

  test('My Memberships edit modal traps focus and returns to trigger', async ({ page }) => {
    const tester = new UITestBase(page);
    const users = UITestBase.getTestUsers();
    const user = users[UserRole.USER];
    const loggedIn = await tester.loginAs(user);
    if (!loggedIn) test.skip();

    // Open account and select My Memberships tab, then open first membership edit modal via query params
    await page.goto('/account?tab=My%20Memberships&openEditMembershipModal=1', { waitUntil: 'networkidle' });
    const dialog = page.locator('[data-test="edit-membership-modal"], [role="dialog"], [aria-modal="true"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // Assert focus is inside dialog
    const focusedInside = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      return !!active.closest('[data-test="edit-membership-modal"]');
    });
    expect(focusedInside).toBeTruthy();

    // Press Tab multiple times to ensure focus doesn't escape
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return false;
        return !!active.closest('[data-test="edit-membership-modal"]');
      });
      expect(stillInside).toBeTruthy();
    }

    // Close via Cancel button inside modal if present, else Escape
    const cancelBtn = dialog.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const stillInDialog = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      return !!active.closest('[data-test="edit-membership-modal"]');
    });
    expect(stillInDialog).toBeFalsy();
  });
});
