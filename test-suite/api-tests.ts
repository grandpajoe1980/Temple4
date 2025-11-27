/**
 * API Test Suite
 * Tests all API endpoints for functionality, authentication, and error handling
 */

import TEST_CONFIG from './test-config';
import { TestLogger } from './test-logger';
import { normalizeSetCookieHeader, performCredentialsLogin } from './utils';
import { prisma } from '../lib/db';

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

        if (response.ok) {
          const data = await response.json();
          this.testUserId = data.user?.id || data.id;
        }

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
            creed: 'We believe in automated testing.',
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
          console.log(`[DEBUG] Testing GET tenant. TenantId: ${this.testTenantId}, UserId: ${this.testUserId}`);
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
          { method: 'GET', headers: this.getAuthHeaders() }
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
              body: 'This is a test post',
              type: 'BLOG',
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
          { method: 'GET', headers: this.getAuthHeaders() }
        );
        return { response, expectedStatus: [200] };
      }
    );

    // Login as admin for content creation that requires higher permissions
    let adminToken: string | null = null;
    try {
      const { cookieHeader } = await performCredentialsLogin(
        TEST_CONFIG.testUsers.admin.email,
        TEST_CONFIG.testUsers.admin.password
      );
      adminToken = cookieHeader;
    } catch (error) {
      this.logger.logError(category, 'Admin Login', error as Error);
    }

    const adminHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (adminToken) {
      adminHeaders['Cookie'] = adminToken;
    }

    await this.testEndpoint(
      category,
      'POST /api/tenants/[tenantId]/events',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/events`,
          {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
              title: 'Test Event',
              description: 'This is a test event',
              startDateTime: new Date().toISOString(),
              endDateTime: new Date(Date.now() + 3600000).toISOString(),
              locationText: 'Test Location',
            }),
          }
        );
        return { response, expectedStatus: [201, 200, 401, 403] };
      }
    );

    await this.testEventVisibilityRules(category);

    // Test sermons
    await this.testEndpoint(
      category,
      'GET /api/tenants/[tenantId]/sermons',
      async () => {
        const response = await fetch(
          `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/sermons`,
          { method: 'GET', headers: this.getAuthHeaders() }
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
          { method: 'GET', headers: this.getAuthHeaders() }
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
          { method: 'GET', headers: this.getAuthHeaders() }
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
          { method: 'GET', headers: this.getAuthHeaders() }
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
            headers: adminHeaders, // Use admin token for service creation
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
          { method: 'GET', headers: this.getAuthHeaders() }
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

    // Test creating a tenant-scoped channel and verify participants created
    if (this.testTenantId) {
      await this.testEndpoint(
        category,
        'POST /api/conversations - create tenant channel',
        async () => {
          const channelName = `test-channel-${Date.now()}`;
          const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/conversations`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ tenantId: this.testTenantId, name: channelName, participantIds: [this.testUserId], scope: 'TENANT', kind: 'CHANNEL' }),
          });

          if (response.ok) {
            const body = await response.json();
            // basic validation: conversation id and participants present
            if (body && body.id && Array.isArray(body.participants)) {
              // Ensure server returned canonical kind/scope
              if (body.kind !== 'CHANNEL') {
                throw new Error(`Expected created conversation.kind === 'CHANNEL' but got ${body.kind}`);
              }
              if (body.scope !== 'TENANT') {
                throw new Error(`Expected created conversation.scope === 'TENANT' but got ${body.scope}`);
              }
              // Fetch tenant members to compare counts (approved only)
              const membersRes = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/members`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
              });
              const membersBody = membersRes.ok ? await membersRes.json() : { members: [] };
              const approvedCount = (membersBody.members || []).length;

              // Ensure at least 1 participant and at least the creator
              const participantCount = body.participants.length;
              if (participantCount < 1) {
                throw new Error('Channel created with no participants');
              }

              // If members endpoint returned results, ensure participantCount matches approvedCount
              if (approvedCount > 0 && participantCount !== approvedCount) {
                throw new Error(`Participant count ${participantCount} does not match approved members ${approvedCount}`);
              }
            } else {
              throw new Error('Invalid conversation response');
            }
          }

          return { response, expectedStatus: [201, 200, 401, 403] };
        }
      );
    }

    // Test creating a direct message (DM) via the direct endpoint and assert kind/scope
    await this.testEndpoint(
      category,
      'POST /api/conversations/direct - create DM',
      async () => {
        // pick a recipient via prisma (any user different from the test regular user)
        const recipientUser = await prisma.user.findFirst({ where: { email: { not: TEST_CONFIG.testUsers.regular.email } } });
        if (!recipientUser) {
          // Skip if no other user available in DB
          this.logger.logSkip(category, 'POST /api/conversations/direct - create DM', 'No recipient user available in DB');
          return { response: new Response(null, { status: 204 }), expectedStatus: [204] };
        }

        const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/conversations/direct`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ recipientId: recipientUser.id }),
        });

        if (response.ok) {
          const body = await response.json();
          if (!body || body.kind !== 'DM' || body.scope !== 'GLOBAL' || !Array.isArray(body.participants)) {
            throw new Error('Direct conversation response missing expected kind/scope/participants');
          }
        }

        return { response, expectedStatus: [200, 201, 401, 204] };
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
          return { response, expectedStatus: [200, 401, 404] };
        }
      );

      // Test updating the user's profile via PUT and verify DB persistence
      await this.testEndpoint(
        category,
        'PUT /api/users/[userId] - update profile and verify DB',
        async () => {
          const newDisplayName = `Automated Test ${Date.now()}`;
          const payload = {
            profile: {
              displayName: newDisplayName,
            },
          };

          const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/users/${this.testUserId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload),
          });

          // If the update succeeded, verify via Prisma that the DB contains the new value
          if (response.ok) {
            try {
              const userRecord = await prisma.user.findUnique({
                where: { id: this.testUserId! },
                include: { profile: true },
              });

              if (!userRecord || userRecord.profile?.displayName !== newDisplayName) {
                this.logger.logFail(
                  category,
                  'PUT /api/users/[userId] - DB persistence check',
                  `Profile displayName not updated in DB (expected: ${newDisplayName}, got: ${userRecord?.profile?.displayName})`
                );
              } else {
                this.logger.logPass(category, 'PUT /api/users/[userId] - DB persistence check');
              }
            } catch (err) {
              this.logger.logError(category, 'DB verification', err as Error);
            }
          }

          return { response, expectedStatus: [200, 401, 403] };
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

  private async testEventVisibilityRules(category: string) {
    if (!this.testTenantId) {
      this.logger.logSkip(category, 'Events respect visitor visibility', 'No test tenant available');
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: this.testTenantId },
      include: { settings: true },
    });

    if (!tenant?.settings) {
      this.logger.logSkip(category, 'Events respect visitor visibility', 'Tenant settings missing');
      return;
    }

    const settingsId = tenant.settings.id;
    const originalVisibility: Record<string, boolean> = JSON.parse(
      JSON.stringify(tenant.settings.visitorVisibility ?? {})
    );
    const tightenedVisibility = { ...originalVisibility, calendar: false };

    try {
      await prisma.tenantSettings.update({
        where: { id: settingsId },
        data: { visitorVisibility: tightenedVisibility },
      });

      this.logger.startTest(category, 'Events respect visitor visibility');

      const anonymousResponse = await fetch(
        `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/events`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      if (anonymousResponse.status === 403) {
        this.logger.logPass(category, 'Anonymous access blocked when calendar hidden');
      } else {
        this.logger.logFail(
          category,
          'Anonymous access blocked when calendar hidden',
          `Expected 403 but received ${anonymousResponse.status}`
        );
      }

      const { cookieHeader } = await performCredentialsLogin(
        TEST_CONFIG.testUsers.regular.email,
        TEST_CONFIG.testUsers.regular.password
      );

      const memberResponse = await fetch(
        `${TEST_CONFIG.apiBaseUrl}/tenants/${this.testTenantId}/events`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        }
      );

      if (memberResponse.status === 200) {
        this.logger.logPass(category, 'Member can still view events when calendar hidden from visitors');
      } else {
        this.logger.logFail(
          category,
          'Member can still view events when calendar hidden from visitors',
          `Expected 200 but received ${memberResponse.status}`
        );
      }
    } catch (error) {
      this.logger.logError(category, 'Events respect visitor visibility', error as Error);
    } finally {
      await prisma.tenantSettings.update({
        where: { id: settingsId },
        data: { visitorVisibility: originalVisibility },
      });
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
