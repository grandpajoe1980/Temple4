/**
 * Page Test Suite
 * Tests all pages for loading, rendering, and basic functionality
 */

import TEST_CONFIG from './test-config';
import { TestLogger } from './test-logger';
import { performCredentialsLogin } from './utils';

export class PageTestSuite {
  private logger: TestLogger;
  private testTenantId: string | null = null;
  private testUserId: string | null = null;

  constructor(logger: TestLogger) {
    this.logger = logger;
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('STARTING PAGE TESTS');
    console.log('='.repeat(60));

    await this.testPublicPages();
    await this.testAuthenticatedPages();
    await this.testTenantPages();
    await this.testAdminPages();
  }

  setTestIds(tenantId: string | null, userId: string | null) {
    this.testTenantId = tenantId;
    this.testUserId = userId;
  }

  private async testPublicPages() {
    const category = 'Pages - Public';

    for (const page of TEST_CONFIG.pages.public) {
      await this.testPage(category, page.name, page.path);
    }
  }

  private async testAuthenticatedPages() {
    const category = 'Pages - Authenticated';

    for (const page of TEST_CONFIG.pages.authenticated) {
      let path = page.path;
      
      // Replace dynamic segments
      if (path.includes('[userId]')) {
        if (this.testUserId) {
          path = path.replace('[userId]', this.testUserId);
        } else {
          // Try to obtain a test user by logging in the configured regular test user
          try {
            const { cookieHeader } = await performCredentialsLogin(TEST_CONFIG.testUsers.regular.email, TEST_CONFIG.testUsers.regular.password);
            if (cookieHeader) {
              const meResp = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/me`, { headers: { Cookie: cookieHeader } });
              if (meResp.ok) {
                const me = await meResp.json();
                const userId = me?.id || me?.user?.id || me?.profile?.userId;
                if (userId) {
                  this.testUserId = userId;
                  path = path.replace('[userId]', this.testUserId as string);
                } else {
                  this.logger.logSkip(category, page.name, 'Could not determine test user ID after login');
                  continue;
                }
              } else {
                this.logger.logSkip(category, page.name, 'Could not fetch /api/auth/me after login');
                continue;
              }
            } else {
              this.logger.logSkip(category, page.name, 'Login failed for regular test user');
              continue;
            }
          } catch (err) {
            this.logger.logSkip(category, page.name, 'Error obtaining test user ID: ' + (err as Error).message);
            continue;
          }
        }
      }

      await this.testPage(category, page.name, path);
    }
  }

  private async testTenantPages() {
    const category = 'Pages - Tenant';

    if (!this.testTenantId) {
      this.logger.logSkip(category, 'All tenant pages', 'No test tenant available');
      return;
    }

    for (const page of TEST_CONFIG.pages.tenant) {
      const path = page.path.replace('[tenantId]', this.testTenantId);
      await this.testPage(category, page.name, path);
    }
  }

  private async testAdminPages() {
    const category = 'Pages - Admin';

    for (const page of TEST_CONFIG.pages.admin) {
      await this.testPage(category, page.name, page.path);
    }
  }

  private async testPage(category: string, name: string, path: string) {
    this.logger.startTest(category, name);

    try {
      const url = `${TEST_CONFIG.baseUrl}${path}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const contentType = response.headers.get('content-type');
      const body = await response.text();

      // Check if it's HTML
      const isHtml = contentType?.includes('text/html') || body.includes('<!DOCTYPE html>') || body.includes('<html');

      // Check for common errors - be more specific to avoid false positives
      const hasError = body.includes('Application error: a client-side exception has occurred') ||
                      body.includes('Unhandled Runtime Error') ||
                      body.includes('<div id="__next-build-watcher"') ||
                      (body.includes('500') && body.includes('Internal Server Error') && !body.includes('statusCode'));

      const hasReactError = body.includes('Unhandled Runtime Error') ||
                           body.includes('React Error Overlay') ||
                           (body.includes('__NEXT_DATA__') && body.includes('"err":{'));

      const redirected = response.redirected;
      const finalUrl = response.url;

      // Log all page visits with their status
      console.log(`  ${response.status === 200 ? '✓' : response.status === 404 ? '✗' : '⚠'} ${name}: ${response.status} - ${url}`);

      if (response.ok && isHtml && !hasError && !hasReactError) {
        this.logger.logPass(category, name, {
          status: response.status,
          url: path,
          redirected,
          finalUrl: redirected ? finalUrl : undefined,
          contentLength: body.length,
        });
      } else if (response.status === 404) {
        this.logger.logFail(
          category,
          name,
          'Page not found (404)',
          { url: path, message: 'Route does not exist or page.tsx is missing' }
        );
      } else if (response.status === 500) {
        this.logger.logFail(
          category,
          name,
          'Internal server error (500)',
          { url: path, bodyPreview: body.substring(0, 500) }
        );
      } else if (hasError || hasReactError) {
        this.logger.logFail(
          category,
          name,
          'Page contains error',
          { 
            url: path,
            status: response.status,
            errorPreview: this.extractErrorMessage(body),
          }
        );
      } else if (!isHtml) {
        this.logger.logFail(
          category,
          name,
          'Response is not HTML',
          { 
            url: path,
            status: response.status,
            contentType,
          }
        );
      } else {
        this.logger.logFail(
          category,
          name,
          `Unexpected response status: ${response.status}`,
          { url: path, contentType }
        );
      }
    } catch (error) {
      console.log(`  ✗ ${name}: ERROR - ${path}`);
      this.logger.logError(category, name, error as Error, { url: path });
    }
  }

  private extractErrorMessage(html: string): string {
    // Try to extract error message from HTML
    const errorPatterns = [
      /Error:\s*([^\n<]+)/i,
      /error['"]\s*:\s*["']([^"']+)/i,
      /<div[^>]*error[^>]*>([^<]+)</i,
      /message['"]\s*:\s*["']([^"']+)/i,
    ];

    for (const pattern of errorPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 200);
      }
    }

    return 'Error detected but message could not be extracted';
  }
}
