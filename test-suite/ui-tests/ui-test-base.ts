import { Page, Locator, expect } from '@playwright/test';

/**
 * User roles for testing
 */
export enum UserRole {
  VISITOR = 'visitor',
  USER = 'user',
  TENANT_ADMIN = 'tenant_admin',
  PLATFORM_ADMIN = 'platform_admin'
}

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
  tenantId?: string;
}

/**
 * Button interaction result
 */
export interface ButtonTestResult {
  button: string;
  selector: string;
  clicked: boolean;
  error?: string;
  actionResult?: string;
}

/**
 * Page test result
 */
export interface PageTestResult {
  page: string;
  url: string;
  role: UserRole;
  loaded: boolean;
  buttonsFound: number;
  buttonsTested: number;
  buttonsWorking: number;
  buttonsFailing: number;
  buttons: ButtonTestResult[];
  errors: string[];
  screenshot?: string;
}

/**
 * Base class for UI testing with authentication helpers
 */
export class UITestBase {
  protected page: Page;
  protected baseURL: string = 'http://localhost:3000';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get test users for different roles
   */
  static getTestUsers(): Record<UserRole, TestUser> {
    return {
      [UserRole.VISITOR]: {
        email: '',
        password: '',
        role: UserRole.VISITOR,
        name: 'Visitor (Not Logged In)'
      },
      [UserRole.USER]: {
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        role: UserRole.USER,
        name: 'Standard User'
      },
      [UserRole.TENANT_ADMIN]: {
        email: 'admin@gracechurch.org',
        password: 'AdminPassword123!',
        role: UserRole.TENANT_ADMIN,
        name: 'Tenant Admin',
        tenantId: 'cmi3atear0014ums4fuftaa9r'
      },
      [UserRole.PLATFORM_ADMIN]: {
        email: 'superadmin@temple.com',
        password: 'SuperAdminPass123!',
        role: UserRole.PLATFORM_ADMIN,
        name: 'Platform Admin'
      }
    };
  }

  /**
   * Login as a specific user role
   */
  async loginAs(user: TestUser): Promise<boolean> {
    if (user.role === UserRole.VISITOR) {
      await this.logout();
      return true;
    }

    try {
      await this.page.goto('/auth/login');
      
      // Wait for the page to fully load and hydrate
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
      
      // Additional wait for React hydration
      await this.page.waitForTimeout(1000);

      // Fill login form - try multiple possible selectors
      const emailInput = this.page.locator('input[name="email"], input[type="email"], input[id="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill(user.email);

      const passwordInput = this.page.locator('input[name="password"], input[type="password"], input[id="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      await passwordInput.fill(user.password);

      // Click login button - try multiple possible selectors
      const loginButton = this.page.locator('button[type="submit"], button:has-text("Login")').first();
      await loginButton.waitFor({ state: 'visible', timeout: 5000 });
      await loginButton.click();

      // Wait for navigation with a longer timeout
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Give time for redirect
      await this.page.waitForTimeout(2000);

      // Check if login was successful
      const url = this.page.url();
      const isLoginPage = url.includes('/auth/login');
      
      if (isLoginPage) {
        // Check for error messages
        const errorText = await this.page.textContent('body');
        console.error(`❌ Login failed for ${user.email}`);
        console.error(`   Current URL: ${url}`);
        if (errorText?.includes('Invalid') || errorText?.includes('error')) {
          console.error('   Error on page:', errorText.substring(0, 200));
        }
        return false;
      }

      console.log(`✓ Successfully logged in as ${user.role} (${user.email})`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to login as ${user.role}:`, error.message);
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Try to find and click logout button
      const logoutButtons = [
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")'
      ];

      for (const selector of logoutButtons) {
        try {
          const button = this.page.locator(selector).first();
          if (await button.isVisible({ timeout: 1000 })) {
            await button.click();
            await this.page.waitForLoadState('networkidle');
            return;
          }
        } catch (e) {
          // Button not found, try next
        }
      }

      // If no logout button found, clear cookies
      await this.page.context().clearCookies();
      await this.page.goto('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  /**
   * Discover all interactive elements on the page
   */
  async discoverButtons(): Promise<string[]> {
    const selectors: string[] = [];

    try {
      // Common button selectors
      const buttonTypes = [
        'button',
        'a[href]',
        'input[type="submit"]',
        'input[type="button"]',
        '[role="button"]',
        '[onclick]'
      ];

      for (const baseSelector of buttonTypes) {
        const elements = await this.page.locator(baseSelector).all();
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          try {
            if (await el.isVisible({ timeout: 500 })) {
              const text = await el.textContent();
              const href = await el.getAttribute('href');
              const ariaLabel = await el.getAttribute('aria-label');
              
              // Create a descriptive label
              let label = text?.trim() || ariaLabel || href || `Element ${i + 1}`;
              if (label.length > 50) label = label.substring(0, 47) + '...';
              
              // Create a more stable selector using nth() instead of nth-match()
              const uniqueSelector = `${baseSelector} >> nth=${i}`;
              
              selectors.push(`${label}|||${uniqueSelector}`);
            }
          } catch (e) {
            // Element not accessible, skip
          }
        }
      }
    } catch (error) {
      console.error('Error discovering buttons:', error);
    }

    return selectors;
  }

  /**
   * Test clicking a button and observe the result
   */
  async testButton(buttonLabel: string, selector: string): Promise<ButtonTestResult> {
    const result: ButtonTestResult = {
      button: buttonLabel,
      selector: selector,
      clicked: false
    };

    try {
      const element = this.page.locator(selector).first();
      
      if (!await element.isVisible({ timeout: 2000 })) {
        result.error = 'Button not visible';
        return result;
      }

      // Get the initial URL and state
      const initialUrl = this.page.url();
      
      // Try to click the button
      await element.click({ timeout: 5000 });
      result.clicked = true;

      // Wait a bit for any action to complete
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(1000);

      // Check what happened
      const newUrl = this.page.url();
      
      if (newUrl !== initialUrl) {
        result.actionResult = `Navigated to: ${newUrl}`;
      } else {
        // Check for modals, dialogs, or content changes
        const hasModal = await this.page.locator('[role="dialog"], .modal, [aria-modal="true"]').isVisible().catch(() => false);
        const hasAlert = await this.page.locator('[role="alert"], .alert, .toast').isVisible().catch(() => false);
        
        if (hasModal) {
          result.actionResult = 'Opened modal/dialog';
        } else if (hasAlert) {
          result.actionResult = 'Showed alert/notification';
        } else {
          result.actionResult = 'Action completed (no visible change)';
        }
      }

    } catch (error: any) {
      result.error = error.message || 'Unknown error';
      result.clicked = false;
    }

    return result;
  }

  /**
   * Test a complete page with all its buttons
   */
  async testPage(url: string, user: TestUser): Promise<PageTestResult> {
    const result: PageTestResult = {
      page: url,
      url: url,
      role: user.role,
      loaded: false,
      buttonsFound: 0,
      buttonsTested: 0,
      buttonsWorking: 0,
      buttonsFailing: 0,
      buttons: [],
      errors: []
    };

    try {
      // Navigate to page
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      result.loaded = true;

      // Discover buttons
      const buttonSelectors = await this.discoverButtons();
      result.buttonsFound = buttonSelectors.length;

      // Test each button
      for (const buttonInfo of buttonSelectors) {
        const [label, selector] = buttonInfo.split('|||');
        
        // Re-navigate to the page before each button test
        await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        const buttonResult = await this.testButton(label, selector);
        result.buttons.push(buttonResult);
        result.buttonsTested++;

        if (buttonResult.error) {
          result.buttonsFailing++;
        } else if (buttonResult.clicked) {
          result.buttonsWorking++;
        }
      }

      // Take screenshot
      const timestamp = Date.now();
      const screenshotPath = `test-results/screenshots/${user.role}-${url.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;

    } catch (error: any) {
      result.errors.push(error.message || 'Unknown error loading page');
      result.loaded = false;
    }

    return result;
  }

  /**
   * Check if user has access to a page
   */
  async checkAccess(url: string): Promise<{ hasAccess: boolean; reason?: string }> {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      
      const currentUrl = this.page.url();
      
      // Check if redirected to login
      if (currentUrl.includes('/auth/login')) {
        return { hasAccess: false, reason: 'Redirected to login' };
      }

      // Check for 403/404 messages
      const content = await this.page.content();
      if (content.includes('403') || content.includes('Forbidden') || content.includes('Access Denied')) {
        return { hasAccess: false, reason: '403 Forbidden' };
      }
      if (content.includes('404') || content.includes('Not Found')) {
        return { hasAccess: false, reason: '404 Not Found' };
      }

      return { hasAccess: true };
    } catch (error: any) {
      return { hasAccess: false, reason: error.message };
    }
  }
}
