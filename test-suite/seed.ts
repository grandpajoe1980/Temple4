import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
// We'll create users directly instead of importing registerUser to avoid path-alias imports in tests
import TEST_CONFIG from './test-config';

export async function seedTestData() {
  // Cleanup existing test users and tenant by slug/email
  const emails = [
    TEST_CONFIG.testUsers.admin.email.toLowerCase(),
    TEST_CONFIG.testUsers.regular.email.toLowerCase(),
    TEST_CONFIG.testUsers.moderator.email.toLowerCase(),
  ];

  // Remove any existing data for deterministic re-seed
  await prisma.chatMessage.deleteMany({ where: {}}).catch(() => {});
  await prisma.conversationParticipant.deleteMany({ where: {} }).catch(() => {});
  await prisma.conversation.deleteMany({ where: {} }).catch(() => {});
  await prisma.notification.deleteMany({ where: {} }).catch(() => {});

  // Delete users with matching emails
  for (const e of emails) {
    try {
      await prisma.user.deleteMany({ where: { email: e } });
    } catch (e) {}
  }

  // Delete existing tenant with same slug
  try {
    await prisma.tenant.deleteMany({ where: { slug: TEST_CONFIG.testTenant.slug } });
  } catch (e) {}

  // Create users directly with hashed passwords
  const createUser = async (displayName: string, email: string, password: string) => {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return existing as any;
    const hashed = await bcrypt.hash(password, 10);
    const u = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        isSuperAdmin: false,
        profile: {
          create: { displayName }
        },
        privacySettings: { create: { showAffiliations: true } },
        accountSettings: { create: { timezonePreference: 'UTC' } },
        notificationPreferences: {},
      },
    });
    return u as any;
  };

  const admin = await createUser(TEST_CONFIG.testUsers.admin.name, TEST_CONFIG.testUsers.admin.email, TEST_CONFIG.testUsers.admin.password);
  const regular = await createUser(TEST_CONFIG.testUsers.regular.name, TEST_CONFIG.testUsers.regular.email, TEST_CONFIG.testUsers.regular.password);
  const moderator = await createUser(TEST_CONFIG.testUsers.moderator.name, TEST_CONFIG.testUsers.moderator.email, TEST_CONFIG.testUsers.moderator.password);

  // Create tenant
  const tenant = await prisma.tenant.create({ data: { name: TEST_CONFIG.testTenant.name, slug: TEST_CONFIG.testTenant.slug, description: TEST_CONFIG.testTenant.description, creed: 'We believe', street: '123 Church St', city: 'Springfield', state: 'SP', country: 'USA', postalCode: '00000' } });

  // Create memberships: admin and moderator approved, regular not a member
  await prisma.userTenantMembership.createMany({ data: [
    { userId: admin.id, tenantId: tenant.id, status: 'APPROVED' },
    { userId: moderator.id, tenantId: tenant.id, status: 'APPROVED' },
  ]});

  // Create a tenant channel conversation (TENANT scope) with admin and moderator
  const tenantChannel = await prisma.conversation.create({
    data: {
      tenantId: tenant.id,
      name: 'staff-channel',
      isDirectMessage: false,
      scope: 'TENANT',
      kind: 'GROUP',
      participants: {
        create: [
          { userId: admin.id },
          { userId: moderator.id }
        ]
      }
    }
  });

  // Create a global DM between admin and regular
  const dm = await prisma.conversation.create({
    data: {
      tenantId: null,
      name: null,
      isDirectMessage: true,
      scope: 'GLOBAL',
      kind: 'DM',
      participants: { create: [{ userId: admin.id }, { userId: regular.id }] }
    }
  });

  // Seed messages
  await prisma.chatMessage.createMany({ data: [
    { conversationId: tenantChannel.id, userId: admin.id, text: 'Welcome staff' },
    { conversationId: tenantChannel.id, userId: moderator.id, text: 'Thanks, noted' },
    { conversationId: dm.id, userId: admin.id, text: 'Hey Homer, hello from Ned!' },
  ]});

  return {
    users: { admin: admin.id, regular: regular.id, moderator: moderator.id },
    tenant: { id: tenant.id, slug: tenant.slug },
    conversations: { tenantChannelId: tenantChannel.id, dmId: dm.id },
  };
}

export default seedTestData;
