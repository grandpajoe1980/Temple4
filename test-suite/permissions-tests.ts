/**
 * Permission System Tests
 * Tests the centralized permission checking system in lib/permissions.ts
 */

import { prisma } from '../lib/db';
import { can, hasRole, canUserViewContent, canUserPost } from '../lib/permissions';
import { TenantRole, MembershipStatus } from '../types';
import { TestLogger } from './test-logger';

export class PermissionTestSuite {
  private logger: TestLogger;

  constructor(logger: TestLogger) {
    this.logger = logger;
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('STARTING PERMISSION TESTS');
    console.log('='.repeat(60));

    await this.testBasicRolePermissions();
    await this.testSuperAdminOverride();
    await this.testFeatureToggles();
    await this.testMembershipStatus();
    await this.testVisitorVisibility();
  }

  private async testBasicRolePermissions() {
    const category = 'Permissions - Basic Roles';

    // Get test tenant and users
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'springfield-church' },
    });

    if (!tenant) {
      this.logger.logSkip(category, 'All role tests', 'Test tenant not found');
      return;
    }

    // Test ADMIN role
    this.logger.startTest(category, 'Admin Can Create Posts');
    try {
      const adminUser = await this.createTestUser('admin-test@test.com');
      await this.createMembership(adminUser.id, tenant.id, [TenantRole.ADMIN], MembershipStatus.APPROVED);
      
      const canCreate = await can(adminUser, tenant, 'canCreatePosts');
      
      if (canCreate) {
        this.logger.logPass(category, 'Admin Can Create Posts', { canCreate });
      } else {
        this.logger.logFail(category, 'Admin Can Create Posts', 'Admin should be able to create posts');
      }

      await this.cleanupTestUser(adminUser.id);
    } catch (error) {
      this.logger.logError(category, 'Admin Can Create Posts', error as Error);
    }

    // Test STAFF role
    this.logger.startTest(category, 'Staff Can Create Talks');
    try {
      const staffUser = await this.createTestUser('staff-test@test.com');
      await this.createMembership(staffUser.id, tenant.id, [TenantRole.STAFF], MembershipStatus.APPROVED);
      
      const canCreate = await can(staffUser, tenant, 'canCreateTalks');
      
      if (canCreate) {
        this.logger.logPass(category, 'Staff Can Create Talks', { canCreate });
      } else {
        this.logger.logFail(category, 'Staff Can Create Talks', 'Staff should be able to create talks');
      }

      await this.cleanupTestUser(staffUser.id);
    } catch (error) {
      this.logger.logError(category, 'Staff Can Create Sermons', error as Error);
    }

    // Test MODERATOR role
    this.logger.startTest(category, 'Moderator Can Moderate Posts');
    try {
      const modUser = await this.createTestUser('mod-test@test.com');
      await this.createMembership(modUser.id, tenant.id, [TenantRole.MODERATOR], MembershipStatus.APPROVED);
      
      const canModerate = await can(modUser, tenant, 'canModeratePosts');
      
      if (canModerate) {
        this.logger.logPass(category, 'Moderator Can Moderate Posts', { canModerate });
      } else {
        this.logger.logFail(category, 'Moderator Can Moderate Posts', 'Moderator should be able to moderate posts');
      }

      await this.cleanupTestUser(modUser.id);
    } catch (error) {
      this.logger.logError(category, 'Moderator Can Moderate Posts', error as Error);
    }

    // Test MEMBER role (limited permissions)
    this.logger.startTest(category, 'Member Cannot Approve Membership');
    try {
      const memberUser = await this.createTestUser('member-test@test.com');
      await this.createMembership(memberUser.id, tenant.id, [TenantRole.MEMBER], MembershipStatus.APPROVED);
      
      const canApprove = await can(memberUser, tenant, 'canApproveMembership');
      
      if (!canApprove) {
        this.logger.logPass(category, 'Member Cannot Approve Membership', { canApprove });
      } else {
        this.logger.logFail(category, 'Member Cannot Approve Membership', 'Regular member should not be able to approve membership');
      }

      await this.cleanupTestUser(memberUser.id);
    } catch (error) {
      this.logger.logError(category, 'Member Cannot Approve Membership', error as Error);
    }
  }

  private async testSuperAdminOverride() {
    const category = 'Permissions - Super Admin';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'springfield-church' },
    });

    if (!tenant) {
      this.logger.logSkip(category, 'Super admin tests', 'Test tenant not found');
      return;
    }

    this.logger.startTest(category, 'Super Admin Can Do Anything');
    try {
      const superAdmin = await this.createTestUser('superadmin-test@test.com', true);
      
      // Super admin should be able to do anything even without membership
      const canCreate = await can(superAdmin, tenant, 'canCreatePosts');
      const canModerate = await can(superAdmin, tenant, 'canModeratePosts');
      const canApprove = await can(superAdmin, tenant, 'canApproveMembership');
      
      if (canCreate && canModerate && canApprove) {
        this.logger.logPass(category, 'Super Admin Can Do Anything', { 
          canCreate, 
          canModerate, 
          canApprove 
        });
      } else {
        this.logger.logFail(category, 'Super Admin Can Do Anything', 'Super admin should have all permissions');
      }

      await this.cleanupTestUser(superAdmin.id);
    } catch (error) {
      this.logger.logError(category, 'Super Admin Can Do Anything', error as Error);
    }
  }

  private async testFeatureToggles() {
    const category = 'Permissions - Feature Toggles';

    // Create a test tenant with specific feature toggles
    this.logger.startTest(category, 'Disabled Feature Returns False');
    try {
      const testTenant = await this.createTestTenant('feature-test-tenant');
      const user = await this.createTestUser('feature-test@test.com');
      await this.createMembership(user.id, testTenant.id, [TenantRole.MEMBER], MembershipStatus.APPROVED);

      // Disable support requests feature
      await prisma.tenantSettings.update({
        where: { tenantId: testTenant.id },
        data: { enableSupportRequests: false },
      });

      const canView = await canUserViewContent(user.id, testTenant.id, 'supportRequests');
      
      if (!canView) {
        this.logger.logPass(category, 'Disabled Feature Returns False', { canView });
      } else {
        this.logger.logFail(category, 'Disabled Feature Returns False', 'Disabled feature should not be viewable');
      }

      await this.cleanupTestTenant(testTenant.id);
      await this.cleanupTestUser(user.id);
    } catch (error) {
      this.logger.logError(category, 'Disabled Feature Returns False', error as Error);
    }
  }

  private async testMembershipStatus() {
    const category = 'Permissions - Membership Status';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'springfield-church' },
    });

    if (!tenant) {
      this.logger.logSkip(category, 'Membership status tests', 'Test tenant not found');
      return;
    }

    // Test PENDING membership
    this.logger.startTest(category, 'Pending Member Has No Permissions');
    try {
      const pendingUser = await this.createTestUser('pending-test@test.com');
      await this.createMembership(pendingUser.id, tenant.id, [TenantRole.MEMBER], MembershipStatus.PENDING);
      
      const canCreate = await can(pendingUser, tenant, 'canCreatePosts');
      
      if (!canCreate) {
        this.logger.logPass(category, 'Pending Member Has No Permissions', { canCreate });
      } else {
        this.logger.logFail(category, 'Pending Member Has No Permissions', 'Pending members should not have permissions');
      }

      await this.cleanupTestUser(pendingUser.id);
    } catch (error) {
      this.logger.logError(category, 'Pending Member Has No Permissions', error as Error);
    }

    // Test BANNED membership
    this.logger.startTest(category, 'Banned Member Has No Permissions');
    try {
      const bannedUser = await this.createTestUser('banned-test@test.com');
      await this.createMembership(bannedUser.id, tenant.id, [TenantRole.MEMBER], MembershipStatus.BANNED);
      
      const canCreate = await can(bannedUser, tenant, 'canCreatePosts');
      
      if (!canCreate) {
        this.logger.logPass(category, 'Banned Member Has No Permissions', { canCreate });
      } else {
        this.logger.logFail(category, 'Banned Member Has No Permissions', 'Banned members should not have permissions');
      }

      await this.cleanupTestUser(bannedUser.id);
    } catch (error) {
      this.logger.logError(category, 'Banned Member Has No Permissions', error as Error);
    }
  }

  private async testVisitorVisibility() {
    const category = 'Permissions - Visitor Visibility';

    // Create a test tenant with specific visitor visibility
    this.logger.startTest(category, 'Non-Member Can View Public Content');
    try {
      const testTenant = await this.createTestTenant('visitor-test-tenant');
      const user = await this.createTestUser('visitor-test@test.com');

      // Enable posts for visitors
      await prisma.tenantSettings.update({
        where: { tenantId: testTenant.id },
        data: { 
          visitorVisibility: {
            posts: true,
            calendar: false,
          }
        },
      });

      const canViewPosts = await canUserViewContent(user.id, testTenant.id, 'posts');
      const canViewCalendar = await canUserViewContent(user.id, testTenant.id, 'calendar');
      
      if (canViewPosts && !canViewCalendar) {
        this.logger.logPass(category, 'Non-Member Can View Public Content', { 
          canViewPosts, 
          canViewCalendar 
        });
      } else {
        this.logger.logFail(category, 'Non-Member Can View Public Content', 'Visitor visibility not working correctly');
      }

      await this.cleanupTestTenant(testTenant.id);
      await this.cleanupTestUser(user.id);
    } catch (error) {
      this.logger.logError(category, 'Non-Member Can View Public Content', error as Error);
    }
  }

  // Helper methods

  private async createTestUser(email: string, isSuperAdmin: boolean = false) {
    return await prisma.user.create({
      data: {
        email,
        password: 'test-password-hash',
        isSuperAdmin,
        profile: {
          create: {
            displayName: `Test User ${email}`,
          },
        },
      },
    });
  }

  private async createMembership(userId: string, tenantId: string, roles: TenantRole[], status: MembershipStatus) {
    return await prisma.userTenantMembership.create({
      data: {
        userId,
        tenantId,
        status,
        roles: {
          create: roles.map(role => ({ role })),
        },
      },
    });
  }

  private async createTestTenant(slug: string) {
    const tenant = await prisma.tenant.create({
      data: {
        name: `Test Tenant ${slug}`,
        slug,
        creed: 'Test creed',
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
        description: 'Test description',
        settings: {
          create: {
            isPublic: true,
            enablePosts: true,
            enableCalendar: true,
            enableSupportRequests: true,
            donationSettings: {},
            liveStreamSettings: {},
            visitorVisibility: {},
          },
        },
      },
    });

    return tenant;
  }

  private async cleanupTestUser(userId: string) {
    await prisma.userTenantMembership.deleteMany({ where: { userId } });
    await prisma.userProfile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }

  private async cleanupTestTenant(tenantId: string) {
    await prisma.tenantSettings.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  }
}
