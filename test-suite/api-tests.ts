/**
 * API Test Suite
 * Tests all API endpoints for functionality, authentication, and error handling
 */

import TEST_CONFIG from './test-config';
import { TestLogger } from './test-logger';
import { normalizeSetCookieHeader, performCredentialsLogin } from './utils';

export class APITestSuite {
  private logger: TestLogger;
  private authToken: string | null = null;
  private testTenantId: string | null = null;
  private testUserId: string | null = null;
  private testServiceId: string | null = null;
  private testFacilityId: string | null = null;

  constructor(logger: TestLogger) {
    this.logger = logger;
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('STARTING API TESTS');
    console.log('='.repeat(60));

    await this.testAuthentication();
    await this.testTenantEndpoints();
    await this.testMemberEndpoints();
    await this.testContentEndpoints();
    await this.testConversationEndpoints();
    await this.testUserEndpoints();
    await this.testAdminEndpoints();
  }

  private async testAuthentication() {
    const category = 'API - Authentication';

    // Test registration
    await this.testEndpoint(
      category,
      'POST /api/auth/register',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            displayName: 'Test User',
          }),
        });
        return { response, expectedStatus: [201, 200] };
      }
    );

    // Test login via NextAuth
    await this.testEndpoint(
      category,
      'POST /api/auth/callback/credentials',
      async () => {
        const { loginResponse, cookieHeader } = await performCredentialsLogin(
          TEST_CONFIG.testUsers.regular.email,
          TEST_CONFIG.testUsers.regular.password
        );

        if (loginResponse.ok || loginResponse.status === 302) {
          this.authToken = cookieHeader;
        }

        return { response: loginResponse, expectedStatus: [200, 302] };
      }
    );

    // Test get current user
    await this.testEndpoint(
      category,
      'GET /api/auth/me',
      async () => {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (this.authToken) {
          headers['Cookie'] = this.authToken;
        }
        
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/me`, {
          method: 'GET',
          headers,
        });
        return { response, expectedStatus: [200, 401] };
      }
    );

    // Test forgot password
    await this.testEndpoint(
      category,
      'POST /api/auth/forgot-password',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CONFIG.testUsers.regular.email,
          }),
        });
        return { response, expectedStatus: [200, 404] };
      }
    );
  }

  private async testTenantEndpoints() {
    const category = 'API - Tenants';

    // Test get all tenants
    await this.testEndpoint(
      category,
      'GET /api/tenants',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
        return { response, expectedStatus: [200] };
      }
    );

    // Test create tenant
    await this.testEndpoint(
      category,
      'POST /api/tenants',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            name: `Test Tenant ${Date.now()}`,
            slug: `test-tenant-${Date.now()}`,
            description: 'A test tenant',
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          this.testTenantId = data.id || data.tenantId;
        }
        
        return { response, expectedStatus: [201, 200, 401] };
      }
    );

    // Test get specific tenant
    if (this.testTenantId) {
      await this.testEndpoint(
        category,
        'GET /api/tenants/[tenantId]',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          return { response, expectedStatus: [200, 404] };
        }
      );
    }
  }

  private async testMemberEndpoints() {
    if (!this.testTenantId) {
      this.logger.logSkip('API - Members', 'All member endpoints', 'No test tenant available');
      return;
    }

    const category = 'API - Members';

    // Test get members
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/members',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/members`,
          {
            method: 'GET',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    // Test join tenant
    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/join',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/join`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 201, 400, 401] };
      }
    );
  }

  private async testContentEndpoints() {
    if (!this.testTenantId) {
      this.logger.logSkip('API - Content', 'All content endpoints', 'No test tenant available');
      return;
    }

    const category = 'API - Content';

    // Test posts
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/posts',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/posts`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/posts',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/posts`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              title: 'Test Post',
              content: 'This is a test post',
            }),
          }
        );
        return { response, expectedStatus: [201, 200, 401, 403] };
      }
    );

    // Test events
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/events',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/events`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/events',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/events`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              title: 'Test Event',
              description: 'This is a test event',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 3600000).toISOString(),
            }),
          }
        );
        return { response, expectedStatus: [201, 200, 401, 403] };
      }
    );

    // Test sermons
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/sermons',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/sermons`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    // Test books
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/books',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/books`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    // Test small groups
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/small-groups',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/small-groups`,
          { method: 'GET', headers: this.getAuthHeaders() }
        );
        return { response, expectedStatus: [200, 401] };
      }
    );

    // Test resources
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/resources',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/resources`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    // Test service offerings
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/services',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/services`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );

    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/services',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/services`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              name: `Test Service ${Date.now()}`,
              description: 'A sample service offering for automated testing.',
              category: 'CEREMONY',
              isPublic: true,
              requiresBooking: false,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          this.testServiceId = data.id || data.serviceId || this.testServiceId;
        }

        return { response, expectedStatus: [201, 200, 401, 403] };
      }
    );

    if (this.testServiceId) {
      await this.testEndpoint(
        category,
        'GET /api/tenants/[tenantId]/services/[serviceId]',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/services/${this.testServiceId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          return { response, expectedStatus: [200, 404] };
        }
      );

      await this.testEndpoint(
        category,
        'PATCH /api/tenants/[tenantId]/services/[serviceId]',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/services/${this.testServiceId}`,
            {
              method: 'PATCH',
              headers: this.getAuthHeaders(),
              body: JSON.stringify({
                pricing: 'Contact us for pricing',
              }),
            }
          );
          return { response, expectedStatus: [200, 401, 403, 404] };
        }
      );

      await this.testEndpoint(
        category,
        'DELETE /api/tenants/[tenantId]/services/[serviceId]',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/services/${this.testServiceId}`,
            { method: 'DELETE', headers: this.getAuthHeaders() }
          );

          if (response.ok) {
            this.testServiceId = null;
          }

          return { response, expectedStatus: [200, 401, 403, 404] };
        }
      );
    }

    // Test community posts
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/community-posts',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/community-posts`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        return { response, expectedStatus: [200] };
      }
    );
  }

  private async testConversationEndpoints() {
    const category = 'API - Conversations';

    await this.testEndpoint(
      category,
      'GET /api/conversations',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/conversations`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
        return { response, expectedStatus: [200, 401] };
      }
    );
  }

  private async testUserEndpoints() {
    const category = 'API - Users';

    if (this.testUserId) {
      await this.testEndpoint(
        category,
        'GET /api/users/[userId]',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/users/${this.testUserId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          return { response, expectedStatus: [200, 404] };
        }
      );
    }
  }

  private async testAdminEndpoints() {
    if (!this.testTenantId) {
      this.logger.logSkip('API - Admin', 'All admin endpoints', 'No test tenant available');
      return;
    }

    const category = 'API - Admin';

    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/admin/settings',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/settings`,
          {
            method: 'GET',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/admin/branding',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/branding`,
          {
            method: 'GET',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    // Test PATCH branding with social links
    await this.testEndpoint(
      category,
      'PATCH /api/tenants/[tenantId]/admin/branding - Update social links',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/branding`,
          {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              facebookUrl: 'https://facebook.com/testchurch',
              instagramUrl: 'https://instagram.com/testchurch',
              twitterUrl: 'https://twitter.com/testchurch',
              youtubeUrl: 'https://youtube.com/@testchurch',
              websiteUrl: 'https://testchurch.com',
              linkedInUrl: 'https://linkedin.com/company/testchurch',
            }),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    // Test PATCH branding with invalid URL
    await this.testEndpoint(
      category,
      'PATCH /api/tenants/[tenantId]/admin/branding - Invalid URL should fail',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/branding`,
          {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              facebookUrl: 'not-a-valid-url',
            }),
          }
        );
        return { response, expectedStatus: [400, 401, 403] };
      }
    );

    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/admin/audit-logs',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/audit-logs`,
          {
            method: 'GET',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/admin/contact-submissions',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/admin/contact-submissions`,
          {
            method: 'GET',
            headers: this.getAuthHeaders(),
          }
        );
        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/facilities',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/facilities`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        return { response, expectedStatus: [200, 401, 403] };
      }
    );

    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/facilities - Create facility',
      async () => {
        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/facilities`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            name: `Test Facility ${Date.now()}`,
            type: 'ROOM',
            description: 'Automated test facility',
            location: 'Main Campus',
            capacity: 25,
          }),
        });

        if (response.ok) {
          const body = await response.json().catch(() => null);
          this.testFacilityId = (body as any)?.id ?? this.testFacilityId;
        }

        return { response, expectedStatus: [201, 400, 401, 403] };
      }
    );

    if (this.testFacilityId) {
      await this.testEndpoint(
        category,
        'GET /api/tenants/[tenantId]/facilities/[facilityId]/bookings',
        async () => {
          const response = await fetch(
            `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/facilities/${this.testFacilityId}/bookings`,
            {
              method: 'GET',
              headers: this.getAuthHeaders(),
            }
          );

          return { response, expectedStatus: [200, 401, 403, 404] };
        }
      );
    }
  }

  private async testEndpoint(
    category: string,
    name: string,
    testFn: () => Promise<{ response: Response; expectedStatus: number[] }>
  ) {
    this.logger.startTest(category, name);

    try {
      const { response, expectedStatus } = await testFn();
      const contentType = response.headers.get('content-type');
      let body = null;

      try {
        if (contentType?.includes('application/json')) {
          body = await response.json();
        } else {
          body = await response.text();
        }
      } catch (e) {
        // Body parsing failed
      }

      if (expectedStatus.includes(response.status)) {
        this.logger.logPass(category, name, {
          status: response.status,
          contentType,
          hasBody: !!body,
        });
      } else {
        this.logger.logFail(
          category,
          name,
          `Unexpected status code: ${response.status} (expected: ${expectedStatus.join(' or ')})`,
          { body, contentType }
        );
      }
    } catch (error) {
      this.logger.logError(category, name, error as Error);
    }
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Cookie'] = this.authToken;
    }
    return headers;
  }
}
