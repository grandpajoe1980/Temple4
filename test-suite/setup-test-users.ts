import { PrismaClient } from '@prisma/client';
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
        profile: {
          create: {
            displayName: 'Super Admin',
            bio: 'Platform super administrator',
            locationCity: 'Admin City',
            locationCountry: 'USA',
            languages: 'en',
          },
        },
        privacySettings: {
          create: {
            showAffiliations: false,
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
    console.log('✅ Created: superadmin@temple.com / SuperAdminPass123!');

    // 3. Get or create test tenant
    console.log('\nSetting up test tenant...');
    let testTenant = await prisma.tenant.findFirst({
      where: { id: 'cmi3atear0014ums4fuftaa9r' },
    });

    if (!testTenant) {
      // If the specific tenant doesn't exist, create one
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
              isPublic: true,
              membershipApprovalMode: 'OPEN',
              enableCalendar: true,
              enablePosts: true,
              enableSermons: true,
              enablePodcasts: true,
              enableBooks: true,
              enableMemberDirectory: true,
              enableGroupChat: true,
              enableComments: true,
              enableReactions: true,
              enableDonations: true,
              enableVolunteering: true,
              enableSmallGroups: true,
              enableLiveStream: false,
              enablePrayerWall: true,
              enableResourceCenter: false,
              donationSettings: {},
              liveStreamSettings: {},
              visitorVisibility: {},
              maxStorageMB: 1000,
            },
          },
          branding: {
            create: {
              primaryColor: '#D97706',
              accentColor: '#92400E',
              logoUrl: '',
              bannerImageUrl: '',
            },
          },
        },
      });
      console.log('✅ Created test tenant: Grace Community Church');
    } else {
      console.log('✅ Test tenant already exists: Grace Community Church');
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
