import { PrismaClient, Prisma } from '@prisma/client';
import { getInitialTenant } from '../constants';
import type { TenantFeaturePermissions } from '../types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestUsers() {
  console.log('Setting up test users for UI testing...\n');

  try {
    // 1. Create standard test user
    console.log('Creating standard test user...');
    const userPassword = await bcrypt.hash('TestPassword123!', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@example.com' },
      update: {},
      create: {
        email: 'testuser@example.com',
        password: userPassword,
        isSuperAdmin: false,
        profile: {
          create: {
            displayName: 'Test User',
            bio: 'Standard test user for UI testing',
            locationCity: 'Test City',
            locationCountry: 'USA',
            languages: 'en',
          },
        },
        privacySettings: {
          create: {
            showAffiliations: true,
          },
        },
        accountSettings: {
          create: {
            timezonePreference: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            languagePreference: 'en-US',
          },
        },
      },
    });
    console.log('✅ Created: testuser@example.com / TestPassword123!');

    // 1b. Create additional test users referenced by TEST_CONFIG (Homer, Marge, Ned)
    console.log('\nCreating additional named test users (Homer, Marge, Ned)...');
    const homerPassword = await bcrypt.hash('doh123', 10);
    await prisma.user.upsert({
      where: { email: 'homer@simpson.com' },
      update: {},
      create: {
        email: 'homer@simpson.com',
        password: homerPassword,
        isSuperAdmin: false,
        profile: { create: { displayName: 'Homer J. Simpson', bio: 'Regular test user', locationCity: 'Springfield', locationCountry: 'USA', languages: 'en' } },
      },
    });

    const margePassword = await bcrypt.hash('bluebeehive', 10);
    await prisma.user.upsert({
      where: { email: 'marge@simpson.com' },
      update: {},
      create: {
        email: 'marge@simpson.com',
        password: margePassword,
        isSuperAdmin: false,
        profile: { create: { displayName: 'Marge Simpson', bio: 'Moderator test user', locationCity: 'Springfield', locationCountry: 'USA', languages: 'en' } },
      },
    });

    const nedPassword = await bcrypt.hash('okily-dokily', 10);
    await prisma.user.upsert({
      where: { email: 'ned@flanders.com' },
      update: {},
      create: {
        email: 'ned@flanders.com',
        password: nedPassword,
        isSuperAdmin: false,
        profile: { create: { displayName: 'Ned Flanders', bio: 'Admin test user', locationCity: 'Springfield', locationCountry: 'USA', languages: 'en' } },
      },
    });

    console.log('✅ Created: homer@simpson.com / doh123, marge@simpson.com / bluebeehive, ned@flanders.com / okily-dokily');

    // 2. Create platform super admin
    console.log('\nCreating platform super admin...');
    const superAdminPassword = await bcrypt.hash('SuperAdminPass123!', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@temple.com' },
      update: {},
      create: {
        email: 'superadmin@temple.com',
        password: superAdminPassword,
        isSuperAdmin: true,
        profile: { create: { displayName: 'Super Admin', bio: 'Platform super administrator', locationCity: 'Admin City', locationCountry: 'USA', languages: 'en' } },
        privacySettings: { create: { showAffiliations: false } },
        accountSettings: { create: { timezonePreference: 'America/New_York', dateFormat: 'MM/DD/YYYY', timeFormat: '12h', languagePreference: 'en-US' } },
      },
    });
    console.log('✅ Created: superadmin@temple.com / SuperAdminPass123!');

      const initialTenant = getInitialTenant();
      // Use a narrowed type for permissions payload; cast to any to satisfy the compiler here
      const perms = initialTenant.permissions as any;

      // Build Prisma-compatible JSON payloads explicitly to avoid casts
      const donationSettingsPayload: Prisma.InputJsonObject = {
        mode: initialTenant.settings.donationSettings.mode,
        externalUrl: initialTenant.settings.donationSettings.externalUrl,
        currency: initialTenant.settings.donationSettings.currency,
        suggestedAmounts: initialTenant.settings.donationSettings.suggestedAmounts,
        allowCustomAmounts: initialTenant.settings.donationSettings.allowCustomAmounts,
        leaderboardEnabled: initialTenant.settings.donationSettings.leaderboardEnabled,
        leaderboardVisibility: initialTenant.settings.donationSettings.leaderboardVisibility,
        leaderboardTimeframe: initialTenant.settings.donationSettings.leaderboardTimeframe,
        paypalUrl: initialTenant.settings.donationSettings.paypalUrl,
        venmoHandle: initialTenant.settings.donationSettings.venmoHandle,
        zelleEmail: initialTenant.settings.donationSettings.zelleEmail,
        cashAppTag: initialTenant.settings.donationSettings.cashAppTag,
        mailingAddress: initialTenant.settings.donationSettings.mailingAddress,
        taxId: initialTenant.settings.donationSettings.taxId,
        bankTransferInstructions: initialTenant.settings.donationSettings.bankTransferInstructions,
        textToGiveNumber: initialTenant.settings.donationSettings.textToGiveNumber,
        otherGivingNotes: initialTenant.settings.donationSettings.otherGivingNotes,
        otherGivingLinks: initialTenant.settings.donationSettings.otherGivingLinks,
      };

      const liveStreamSettingsPayload: Prisma.InputJsonObject = {
        provider: initialTenant.settings.liveStreamSettings.provider,
        embedUrl: initialTenant.settings.liveStreamSettings.embedUrl,
        isLive: initialTenant.settings.liveStreamSettings.isLive,
      };

      const visitorVisibilityPayload: Prisma.InputJsonObject = {
        calendar: initialTenant.settings.visitorVisibility.calendar,
        posts: initialTenant.settings.visitorVisibility.posts,
        sermons: initialTenant.settings.visitorVisibility.sermons,
        podcasts: initialTenant.settings.visitorVisibility.podcasts,
        photos: initialTenant.settings.visitorVisibility.photos,
        books: initialTenant.settings.visitorVisibility.books,
        prayerWall: initialTenant.settings.visitorVisibility.prayerWall,
      };

      const permissionsPayload: Prisma.InputJsonObject = {
        MEMBER: {
          canCreatePosts: perms.MEMBER.canCreatePosts,
          canCreateEvents: perms.MEMBER.canCreateEvents,
          canCreateSermons: perms.MEMBER.canCreateSermons,
          canCreatePodcasts: perms.MEMBER.canCreatePodcasts,
          canCreateBooks: perms.MEMBER.canCreateBooks,
          canCreateGroupChats: perms.MEMBER.canCreateGroupChats,
          canInviteMembers: perms.MEMBER.canInviteMembers,
          canApproveMembership: perms.MEMBER.canApproveMembership,
          canBanMembers: perms.MEMBER.canBanMembers,
          canModeratePosts: perms.MEMBER.canModeratePosts,
          canModerateChats: perms.MEMBER.canModerateChats,
          canPostInAnnouncementChannels: perms.MEMBER.canPostInAnnouncementChannels,
          canManagePrayerWall: perms.MEMBER.canManagePrayerWall,
          canUploadResources: perms.MEMBER.canUploadResources,
          canManageResources: perms.MEMBER.canManageResources,
          canManageContactSubmissions: perms.MEMBER.canManageContactSubmissions,
          canManageFacilities: perms.MEMBER.canManageFacilities,
        },
        STAFF: {
          canCreatePosts: perms.STAFF.canCreatePosts,
          canCreateEvents: perms.STAFF.canCreateEvents,
          canCreateSermons: perms.STAFF.canCreateSermons,
          canCreatePodcasts: perms.STAFF.canCreatePodcasts,
          canCreateBooks: perms.STAFF.canCreateBooks,
          canCreateGroupChats: perms.STAFF.canCreateGroupChats,
          canInviteMembers: perms.STAFF.canInviteMembers,
          canApproveMembership: perms.STAFF.canApproveMembership,
          canBanMembers: perms.STAFF.canBanMembers,
          canModeratePosts: perms.STAFF.canModeratePosts,
          canModerateChats: perms.STAFF.canModerateChats,
          canPostInAnnouncementChannels: perms.STAFF.canPostInAnnouncementChannels,
          canManagePrayerWall: perms.STAFF.canManagePrayerWall,
          canUploadResources: perms.STAFF.canUploadResources,
          canManageResources: perms.STAFF.canManageResources,
          canManageContactSubmissions: perms.STAFF.canManageContactSubmissions,
          canManageFacilities: perms.STAFF.canManageFacilities,
        },
        MODERATOR: {
          canCreatePosts: perms.MODERATOR.canCreatePosts,
          canCreateEvents: perms.MODERATOR.canCreateEvents,
          canCreateSermons: perms.MODERATOR.canCreateSermons,
          canCreatePodcasts: perms.MODERATOR.canCreatePodcasts,
          canCreateBooks: perms.MODERATOR.canCreateBooks,
          canCreateGroupChats: perms.MODERATOR.canCreateGroupChats,
          canInviteMembers: perms.MODERATOR.canInviteMembers,
          canApproveMembership: perms.MODERATOR.canApproveMembership,
          canBanMembers: perms.MODERATOR.canBanMembers,
          canModeratePosts: perms.MODERATOR.canModeratePosts,
          canModerateChats: perms.MODERATOR.canModerateChats,
          canPostInAnnouncementChannels: perms.MODERATOR.canPostInAnnouncementChannels,
          canManagePrayerWall: perms.MODERATOR.canManagePrayerWall,
          canUploadResources: perms.MODERATOR.canUploadResources,
          canManageResources: perms.MODERATOR.canManageResources,
          canManageContactSubmissions: perms.MODERATOR.canManageContactSubmissions,
          canManageFacilities: perms.MODERATOR.canManageFacilities,
        },
        ADMIN: {
          canCreatePosts: perms.ADMIN.canCreatePosts,
          canCreateEvents: perms.ADMIN.canCreateEvents,
          canCreateSermons: perms.ADMIN.canCreateSermons,
          canCreatePodcasts: perms.ADMIN.canCreatePodcasts,
          canCreateBooks: perms.ADMIN.canCreateBooks,
          canCreateGroupChats: perms.ADMIN.canCreateGroupChats,
          canInviteMembers: perms.ADMIN.canInviteMembers,
          canApproveMembership: perms.ADMIN.canApproveMembership,
          canBanMembers: perms.ADMIN.canBanMembers,
          canModeratePosts: perms.ADMIN.canModeratePosts,
          canModerateChats: perms.ADMIN.canModerateChats,
          canPostInAnnouncementChannels: perms.ADMIN.canPostInAnnouncementChannels,
          canManagePrayerWall: perms.ADMIN.canManagePrayerWall,
          canUploadResources: perms.ADMIN.canUploadResources,
          canManageResources: perms.ADMIN.canManageResources,
          canManageContactSubmissions: perms.ADMIN.canManageContactSubmissions,
          canManageFacilities: perms.ADMIN.canManageFacilities,
        },
      };
      let testTenant = await prisma.tenant.findFirst({
        where: { id: 'cmi3atear0014ums4fuftaa9r' },
      });
      // Also ensure the Springfield Church tenant exists (used by page tests)
      let springfieldTenant = await prisma.tenant.findFirst({ where: { slug: 'springfield-church' } });

      if (!testTenant) {
        testTenant = await prisma.tenant.create({
        data: {
          id: 'cmi3atear0014ums4fuftaa9r',
          name: 'Grace Community Church',
          slug: 'gracechurch',
          creed: 'We believe in one God, Father, Son, and Holy Spirit',
          street: '123 Main Street',
          city: 'Test City',
          state: 'CA',
          country: 'USA',
          postalCode: '12345',
          contactEmail: 'info@gracechurch.org',
          phoneNumber: '555-1234',
          description: 'Test tenant for UI testing',
          settings: {
            create: {
              isPublic: initialTenant.settings.isPublic,
              membershipApprovalMode: initialTenant.settings.membershipApprovalMode,
              enableCalendar: initialTenant.settings.enableCalendar,
              enablePosts: initialTenant.settings.enablePosts,
              enableSermons: initialTenant.settings.enableSermons,
              enablePodcasts: initialTenant.settings.enablePodcasts,
              enableBooks: initialTenant.settings.enableBooks,
              enableMemberDirectory: initialTenant.settings.enableMemberDirectory,
              enableGroupChat: initialTenant.settings.enableGroupChat,
              enableComments: initialTenant.settings.enableComments,
              enableReactions: initialTenant.settings.enableReactions,
              enableServices: initialTenant.settings.enableServices,
              enableDonations: initialTenant.settings.enableDonations,
              enableVolunteering: initialTenant.settings.enableVolunteering,
              enableSmallGroups: initialTenant.settings.enableSmallGroups,
              enableTrips: initialTenant.settings.enableTrips,
              enableLiveStream: initialTenant.settings.enableLiveStream,
              enablePhotos: initialTenant.settings.enablePhotos,
              enablePrayerWall: initialTenant.settings.enablePrayerWall,
              autoApprovePrayerWall: initialTenant.settings.autoApprovePrayerWall,
              enableResourceCenter: initialTenant.settings.enableResourceCenter,
              enableTripFundraising: initialTenant.settings.enableTripFundraising,
              tripCalendarColor: initialTenant.settings.tripCalendarColor,
              donationSettings: donationSettingsPayload,
              liveStreamSettings: liveStreamSettingsPayload,
              visitorVisibility: visitorVisibilityPayload,
            },
          },
          branding: {
            create: {
              logoUrl: initialTenant.branding.logoUrl,
              bannerImageUrl: initialTenant.branding.bannerImageUrl,
              primaryColor: initialTenant.branding.primaryColor,
              accentColor: initialTenant.branding.accentColor,
              customLinks: initialTenant.branding.customLinks,
            },
          },
          permissions: permissionsPayload,
        },
      });
      console.log('✅ Created test tenant: Grace Community Church');
    } else {
      console.log('✅ Test tenant already exists: Grace Community Church');
    }

      // Create Springfield Community Church if missing (used by TEST_CONFIG)
      if (!springfieldTenant) {
        springfieldTenant = await prisma.tenant.create({
            data: {
            name: 'Springfield Community Church',
            slug: 'springfield-church',
            creed: 'We believe in the community and fellowship of Springfield',
            description: 'Springfield Community Church - seeded for tests',
            street: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'ZZ',
            country: 'USA',
            postalCode: '00000',
            contactEmail: 'info@springfieldchurch.org',
            phoneNumber: '555-0000',
            settings: {
              create: {
                isPublic: initialTenant.settings.isPublic,
                membershipApprovalMode: initialTenant.settings.membershipApprovalMode,
                enableCalendar: initialTenant.settings.enableCalendar,
                enablePosts: initialTenant.settings.enablePosts,
                enableSermons: initialTenant.settings.enableSermons,
                enablePodcasts: initialTenant.settings.enablePodcasts,
                enableBooks: initialTenant.settings.enableBooks,
                enableMemberDirectory: initialTenant.settings.enableMemberDirectory,
                enableGroupChat: initialTenant.settings.enableGroupChat,
                enableComments: initialTenant.settings.enableComments,
                enableReactions: initialTenant.settings.enableReactions,
                enableServices: initialTenant.settings.enableServices,
                enableDonations: initialTenant.settings.enableDonations,
                enableVolunteering: initialTenant.settings.enableVolunteering,
                enableSmallGroups: initialTenant.settings.enableSmallGroups,
                enableTrips: initialTenant.settings.enableTrips,
                enableLiveStream: initialTenant.settings.enableLiveStream,
                enablePhotos: initialTenant.settings.enablePhotos,
                enablePrayerWall: initialTenant.settings.enablePrayerWall,
                autoApprovePrayerWall: initialTenant.settings.autoApprovePrayerWall,
                enableResourceCenter: initialTenant.settings.enableResourceCenter,
                enableTripFundraising: initialTenant.settings.enableTripFundraising,
                tripCalendarColor: initialTenant.settings.tripCalendarColor,
                donationSettings: donationSettingsPayload,
                liveStreamSettings: liveStreamSettingsPayload,
                visitorVisibility: visitorVisibilityPayload,
              },
            },
            branding: {
              create: {
                logoUrl: initialTenant.branding.logoUrl,
                bannerImageUrl: initialTenant.branding.bannerImageUrl,
                primaryColor: initialTenant.branding.primaryColor,
                accentColor: initialTenant.branding.accentColor,
                customLinks: initialTenant.branding.customLinks,
              },
            },
            permissions: permissionsPayload,
          },
        });
        console.log('✅ Created tenant: Springfield Community Church');
      } else {
        console.log('✅ Springfield Community Church tenant already exists');
      }

      // Ensure Homer, Marge, Ned are members of Springfield (so page tests can find user IDs)
      try {
        const homerUser = await prisma.user.findUnique({ where: { email: 'homer@simpson.com' } });
        const margeUser = await prisma.user.findUnique({ where: { email: 'marge@simpson.com' } });
        const nedUser = await prisma.user.findUnique({ where: { email: 'ned@flanders.com' } });

        if (homerUser && springfieldTenant) {
          const m = await prisma.userTenantMembership.upsert({
            where: { userId_tenantId: { userId: homerUser.id, tenantId: springfieldTenant.id } },
            update: {},
            create: { userId: homerUser.id, tenantId: springfieldTenant.id, status: 'APPROVED' },
          });
          await prisma.userTenantRole.create({ data: { membershipId: m.id, role: 'MEMBER', isPrimary: true } });
        }

        if (margeUser && springfieldTenant) {
          const m = await prisma.userTenantMembership.upsert({
            where: { userId_tenantId: { userId: margeUser.id, tenantId: springfieldTenant.id } },
            update: {},
            create: { userId: margeUser.id, tenantId: springfieldTenant.id, status: 'APPROVED' },
          });
          await prisma.userTenantRole.create({ data: { membershipId: m.id, role: 'MODERATOR', isPrimary: true } });
        }

        if (nedUser && springfieldTenant) {
          const m = await prisma.userTenantMembership.upsert({
            where: { userId_tenantId: { userId: nedUser.id, tenantId: springfieldTenant.id } },
            update: {},
            create: { userId: nedUser.id, tenantId: springfieldTenant.id, status: 'APPROVED' },
          });
          await prisma.userTenantRole.create({ data: { membershipId: m.id, role: 'ADMIN', isPrimary: true } });
        }
      } catch (err) {
        console.log('⚠ Could not ensure Springfield memberships:', err);
      }

    // 4. Create tenant admin and add to tenant
    console.log('\nCreating tenant admin...');
    const tenantAdminPassword = await bcrypt.hash('AdminPassword123!', 10);
    const tenantAdmin = await prisma.user.upsert({
      where: { email: 'admin@gracechurch.org' },
      update: {},
      create: {
        email: 'admin@gracechurch.org',
        password: tenantAdminPassword,
        isSuperAdmin: false,
        profile: {
          create: {
            displayName: 'Tenant Admin',
            bio: 'Administrator of Grace Community Church',
            locationCity: 'Test City',
            locationCountry: 'USA',
            languages: 'en',
          },
        },
        privacySettings: {
          create: {
            showAffiliations: true,
          },
        },
        accountSettings: {
          create: {
            timezonePreference: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            languagePreference: 'en-US',
          },
        },
      },
    });
    console.log('✅ Created: admin@gracechurch.org / AdminPassword123!');

    // 5. Add tenant admin to tenant with ADMIN role
    console.log('\nSetting up tenant membership...');
    const membership1 = await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: tenantAdmin.id,
          tenantId: testTenant.id,
        },
      },
      update: {},
      create: {
        userId: tenantAdmin.id,
        tenantId: testTenant.id,
        status: 'APPROVED',
      },
    });

    await prisma.userTenantRole.create({
      data: {
        membershipId: membership1.id,
        role: 'ADMIN',
        isPrimary: true,
      },
    });
    console.log('✅ Tenant admin added to Grace Community Church with ADMIN role');

    // 6. Add standard user to tenant with MEMBER role
    const membership2 = await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        tenantId: testTenant.id,
        status: 'APPROVED',
      },
    });

    await prisma.userTenantRole.create({
      data: {
        membershipId: membership2.id,
        role: 'MEMBER',
        isPrimary: true,
      },
    });
    console.log('✅ Test user added to Grace Community Church with MEMBER role');

    // 7. Ensure platform superadmin is an approved member of the test tenant
    const membershipSuper = await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: superAdmin.id,
          tenantId: testTenant.id,
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        tenantId: testTenant.id,
        status: 'APPROVED',
      },
    });

    await prisma.userTenantRole.create({
      data: {
        membershipId: membershipSuper.id,
        role: 'ADMIN',
        isPrimary: true,
      },
    });
    console.log('✅ Platform superadmin added to Grace Community Church with ADMIN role');

    console.log('\n' + '='.repeat(60));
    console.log('TEST USERS SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nTest Users Created:');
    console.log('1. Visitor (not logged in)');
    console.log('2. Standard User: testuser@example.com / TestPassword123!');
    console.log('3. Tenant Admin: admin@gracechurch.org / AdminPassword123!');
    console.log('4. Platform Admin: superadmin@temple.com / SuperAdminPass123!');
    console.log('\nTest Tenant:');
    console.log(`ID: ${testTenant.id}`);
    console.log(`Name: ${testTenant.name}`);
    console.log(`Slug: ${testTenant.slug}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error setting up test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
