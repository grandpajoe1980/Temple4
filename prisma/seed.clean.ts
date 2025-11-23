import { PrismaClient } from '@prisma/client';
import TENANTS from './tenantBlueprint';
import {
  avatar,
  hashPassword,
  ensureTenant,
  createUsersForTenant,
  createConversationsForTenant,
  postMessage,
  pickDeterministicCrossMembers,
  createOrGetUser,
  createPostsForTenant,
  createProfilePostsForUsers,
  createEventsForTenant,
  createSmallGroupsForTenant,
  createMediaItemsForTenant,
  createLocalPhotosForTenant,
  createFacilitiesForTenant,
  createDonationRecordsForTenant,
  createVolunteerNeedsForTenant,
  createResourceItemsForTenant,
  createCommunityPostsForTenant,
  createDirectMessagesBetweenUsers,
} from './seedHelpers';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting expanded multi-tenant seed...');

  // Ensure platform admin exists (super admin)
  const adminPw = await hashPassword('password');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@temple.com' },
    update: { isSuperAdmin: true },
    create: {
      email: 'admin@temple.com',
      password: adminPw,
      isSuperAdmin: true,
      profile: { create: { displayName: 'Platform Administrator', avatarUrl: avatar('admin@temple.com') } },
    },
  });

  console.log('✅ Platform Administrator ensured: admin@temple.com (password: password)');

  // Keep a mapping of tenantId -> userId[] for cross-tenant selection
  const tenantUserPools: Record<string, string[]> = {};

  for (const def of TENANTS) {
    const tenant = await ensureTenant(prisma, def);

    // Create users and ensure membership
    const usersMap = await createUsersForTenant(prisma, tenant.id, def.users, { password: 'password' });
    const userIds = Object.values(usersMap).map((u: any) => String(u.id));
    tenantUserPools[tenant.id] = userIds;

    // Make sure platform admin is a member of every tenant
    await prisma.userTenantMembership.findFirst({ where: { userId: admin.id, tenantId: tenant.id } })
      .then(async (m) => {
        if (!m) await prisma.userTenantMembership.create({ data: { userId: admin.id, tenantId: tenant.id, status: 'APPROVED' as any } });
      });

    // Create channels / conversations and post some messages
    const channelNames = def.channels.map((c) => c.name);
    const convos = await createConversationsForTenant(prisma, tenant.id, channelNames);

    for (const convo of convos) {
      // Post 5 messages cycling through users
      for (let i = 0; i < 5; i++) {
        const authorId = userIds[i % userIds.length];
        const text = `${usersMap[Object.keys(usersMap)[i % Object.keys(usersMap).length]].displayName} — seeded message #${i + 1} in ${convo.name || convo.title || 'channel'}`;
        await postMessage(prisma, convo.id, authorId, text as string);
      }
    }

    // Create content areas per tenant
    const posts = await createPostsForTenant(prisma, tenant.id, userIds, 5);
    const profilePosts = await createProfilePostsForUsers(prisma, tenant.id, userIds.slice(0, 8), 2);
    const events = await createEventsForTenant(prisma, tenant.id, userIds, 5);
    const groups = await createSmallGroupsForTenant(prisma, tenant.id, userIds, 5);
    const mediaItems = await createMediaItemsForTenant(prisma, tenant.id, userIds, 5);
      // Seed local photos, podcasts, and books
      const photos = await createLocalPhotosForTenant(prisma, tenant.id, def.slug, userIds, 5);
      const podcasts = await (await import('./seedHelpers')).createPodcastsForTenant(prisma, tenant.id, userIds, 4);
      const books = await (await import('./seedHelpers')).createBooksForTenant(prisma, tenant.id, userIds, 4);
    const facilities = await createFacilitiesForTenant(prisma, tenant.id, 3);
    const donations = await createDonationRecordsForTenant(prisma, tenant.id, userIds, 5);
    const needs = await createVolunteerNeedsForTenant(prisma, tenant.id, userIds, 3);
    const resources = await createResourceItemsForTenant(prisma, tenant.id, userIds, 4);
    const community = await createCommunityPostsForTenant(prisma, tenant.id, userIds, 5);

    // Add varied content: comments, reactions, media attachments, facility bookings, announcements, and profile comments
    await (await import('./seedHelpers')).addCommentsToPosts(prisma, tenant.id, posts, userIds, 3);
    await (await import('./seedHelpers')).addReactionsToProfilePosts(prisma, profilePosts.map((p: any) => p.id), userIds.slice(0, 8), 3);
    await (await import('./seedHelpers')).addMediaToProfilePosts(prisma, profilePosts.map((p: any) => p.id), tenant.id);
    await (await import('./seedHelpers')).createFacilityBookingsForEvents(prisma, tenant.id, facilities.map((f: any) => f.id), events);
    await (await import('./seedHelpers')).createSmallGroupAnnouncements(prisma, groups.map((g: any) => g.id), userIds.slice(0, 5));
    await (await import('./seedHelpers')).addCommentsToProfilePosts(prisma, profilePosts.map((p: any) => p.id), userIds.slice(0, 8), 2);

    // Create a DM between first two users when available
    if (userIds.length >= 2) {
      await createDirectMessagesBetweenUsers(prisma, [[userIds[0], userIds[1]]], 4);
    }
  }

  // Cross-tenant memberships: pick two deterministic cross members per tenant and add roles
  for (const def of TENANTS) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: def.slug } });
    if (!tenant) continue;
    const picks = pickDeterministicCrossMembers(def.slug, tenantUserPools, 2);
    for (let i = 0; i < picks.length; i++) {
      const uid = picks[i];
      const role = i === 0 ? 'STAFF' : 'MODERATOR';
      // ensureMembership helper expects role enum; call via createOrGetUser/ensureMembership pattern
      try {
        // create membership if missing and add role
        await prisma.userTenantMembership.findFirst({ where: { userId: uid, tenantId: tenant.id } })
          .then(async (m) => {
            if (!m) await prisma.userTenantMembership.create({ data: { userId: uid, tenantId: tenant.id, status: 'APPROVED' as any } });
          });
        // upsert role row
        await prisma.userTenantRole.create({ data: { membershipId: (await prisma.userTenantMembership.findFirst({ where: { userId: uid, tenantId: tenant.id } }))!.id, role: role as any, isPrimary: false } });
      } catch (err) {
        // ignore duplicates / collisions
      }
    }
  }

  console.log('✅ Seeding complete. Tenants:', TENANTS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
