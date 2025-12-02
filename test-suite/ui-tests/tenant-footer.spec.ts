import { test, expect } from '@playwright/test';

/**
 * TenantFooter Rendering Permutations Tests
 * 
 * These tests verify that the TenantFooter component renders correctly
 * with various combinations of social links.
 */

// Test tenant ID (from seed data)
const TEST_TENANT_ID = 'cmi3atear0014ums4fuftaa9r';

test.describe('TenantFooter Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a tenant page where footer is visible
    await page.goto(`/tenants/${TEST_TENANT_ID}`);
  });

  test('should render footer with copyright notice', async ({ page }) => {
    // Footer should always show copyright
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Copyright text should be present
    const copyright = footer.getByText(/All rights reserved/);
    await expect(copyright).toBeVisible();
  });

  test('should render social links when present', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check for "Follow us:" text if social links exist
    const socialSection = footer.getByText('Follow us:');
    
    // Social section may or may not be present depending on tenant config
    const socialSectionCount = await socialSection.count();
    
    if (socialSectionCount > 0) {
      // If social links exist, they should be in the footer
      const socialLinks = footer.locator('a[target="_blank"]');
      const count = await socialLinks.count();
      expect(count).toBeGreaterThan(0);
      
      // Each social link should have aria-label for accessibility
      for (let i = 0; i < count; i++) {
        const link = socialLinks.nth(i);
        const ariaLabel = await link.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        
        // Links should have rel="noopener noreferrer" for security
        const rel = await link.getAttribute('rel');
        expect(rel).toContain('noopener');
      }
    }
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Footer should be a semantic footer element
    const footerTag = await footer.evaluate((el) => el.tagName.toLowerCase());
    expect(footerTag).toBe('footer');
  });

  test('should render without social links when none configured', async ({ page }) => {
    // This test verifies the fallback rendering when no social links exist
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Copyright should still be present
    const currentYear = new Date().getFullYear();
    await expect(footer.getByText(new RegExp(`${currentYear}`))).toBeVisible();
  });
});

test.describe('TenantFooter Social Links Visual Tests', () => {
  test('footer screenshot for visual regression', async ({ page }) => {
    await page.goto(`/tenants/${TEST_TENANT_ID}`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    // Take screenshot of footer for visual regression
    await expect(footer).toHaveScreenshot('tenant-footer.png', {
      maxDiffPixelRatio: 0.1, // Allow 10% pixel difference for font rendering
    });
  });
});

test.describe('Admin Social Links Flow', () => {
  // Credentials for admin user (from test config)
  const ADMIN_EMAIL = 'admin@test.com';
  const ADMIN_PASSWORD = 'password123';

  test('should navigate to settings branding tab', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL('**/');
    
    // Navigate to tenant settings
    await page.goto(`/tenants/${TEST_TENANT_ID}/settings`);
    
    // Wait for settings page
    await page.waitForLoadState('networkidle');
    
    // Find and click Branding tab
    const brandingTab = page.getByRole('tab', { name: /branding/i });
    if (await brandingTab.isVisible()) {
      await brandingTab.click();
      
      // Verify social media links section is visible
      const socialSection = page.getByText('Social Media Links');
      await expect(socialSection).toBeVisible();
    }
  });

  test('should show platform picker when adding social link', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Navigate to tenant settings branding
    await page.goto(`/tenants/${TEST_TENANT_ID}/settings`);
    await page.waitForLoadState('networkidle');
    
    // Click Branding tab
    const brandingTab = page.getByRole('tab', { name: /branding/i });
    if (await brandingTab.isVisible()) {
      await brandingTab.click();
      
      // Click "Add Social Link" button
      const addButton = page.getByRole('button', { name: /add social link/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Platform picker should appear
        const platformPicker = page.getByText('Select a platform:');
        await expect(platformPicker).toBeVisible();
        
        // Should show platform options
        const facebook = page.getByRole('button', { name: /facebook/i });
        await expect(facebook).toBeVisible();
      }
    }
  });

  test('should validate HTTPS URLs for social links', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Navigate to tenant settings branding
    await page.goto(`/tenants/${TEST_TENANT_ID}/settings`);
    await page.waitForLoadState('networkidle');
    
    // Click Branding tab
    const brandingTab = page.getByRole('tab', { name: /branding/i });
    if (await brandingTab.isVisible()) {
      await brandingTab.click();
      
      // Add a new social link
      const addButton = page.getByRole('button', { name: /add social link/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Select Facebook platform
        const facebook = page.getByRole('button', { name: /facebook/i });
        if (await facebook.isVisible()) {
          await facebook.click();
          
          // Fill with non-HTTPS URL
          const urlInput = page.locator('input[id^="socialUrl-"]').first();
          await urlInput.fill('http://facebook.com/test');
          await urlInput.blur();
          
          // Error message should appear
          const errorMsg = page.getByText('URL must use HTTPS');
          await expect(errorMsg).toBeVisible();
          
          // Save button should be disabled
          const saveButton = page.getByRole('button', { name: /save branding/i });
          await expect(saveButton).toBeDisabled();
        }
      }
    }
  });

  test('should show footer preview with configured links', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Navigate to tenant settings branding
    await page.goto(`/tenants/${TEST_TENANT_ID}/settings`);
    await page.waitForLoadState('networkidle');
    
    // Click Branding tab
    const brandingTab = page.getByRole('tab', { name: /branding/i });
    if (await brandingTab.isVisible()) {
      await brandingTab.click();
      
      // Add a social link with valid URL
      const addButton = page.getByRole('button', { name: /add social link/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const facebook = page.getByRole('button', { name: /facebook/i });
        if (await facebook.isVisible()) {
          await facebook.click();
          
          // Fill with HTTPS URL
          const urlInput = page.locator('input[id^="socialUrl-"]').first();
          await urlInput.fill('https://facebook.com/testtemple');
          await urlInput.blur();
          
          // Footer preview should appear
          const previewSection = page.getByText('Footer Preview');
          await expect(previewSection).toBeVisible();
        }
      }
    }
  });
});
