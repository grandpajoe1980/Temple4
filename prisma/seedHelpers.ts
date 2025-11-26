import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { TenantDef, UserArchetype } from './tenantBlueprint';

export const DEV_BCRYPT_ROUNDS = 6;

// Deterministic placeholder helpers (same patterns as tenantBlueprint)
// Use DiceBear v6+ API (versioned). Return SVG avatars to avoid deprecated API messages.
export const avatar = (seed: string) => `https://api.dicebear.com/6.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=200`;
export const photo = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`;
export const banner = (text: string) => `https://placehold.co/1200x200/222222/ffffff?text=${encodeURIComponent(text)}`;

// Simple deterministic PRNG (mulberry32) for reproducible "random" picks per tenant
function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function hashPassword(password: string, rounds = DEV_BCRYPT_ROUNDS) {
  return bcrypt.hash(password, rounds);
}

// Ensure tenant exists and its one-to-one branding/settings records are present.
export async function ensureTenant(prisma: PrismaClient, t: TenantDef) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: t.slug },
    create: {
      name: t.name,
      slug: t.slug,
      description: t.description || '',
      creed: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      contactEmail: `contact@${t.slug}.example`,
      // create branding and settings eagerly when creating
      branding: {
        create: { logoUrl: t.logoUrl, bannerImageUrl: t.bannerUrl },
      },
      settings: {
        create: { donationSettings: {} as any, liveStreamSettings: {} as any, visitorVisibility: {} as any },
      },
    },
    update: {
      name: t.name,
      description: t.description || '',
    },
  });

  // Upsert branding (tenantId is unique in schema)
  try {
    await prisma.tenantBranding.upsert({
      where: { tenantId: tenant.id },
      create: { tenantId: tenant.id, logoUrl: t.logoUrl, bannerImageUrl: t.bannerUrl },
      update: { logoUrl: t.logoUrl, bannerImageUrl: t.bannerUrl },
    });
  } catch (err) {
    // if tenantBranding model name differs, this will fail — caller should verify schema mappings
  }

  // Ensure TenantSettings contains sensible visitorVisibility defaults so public content can be viewed by visitors
  try {
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        isPublic: false,
        membershipApprovalMode: 'APPROVAL_REQUIRED',
        enableCalendar: true,
        enablePosts: true,
        enableSermons: true,
        enablePodcasts: true,
        enableBooks: true,
        enableMemberDirectory: true,
        enableGroupChat: true,
        enableComments: true,
        enableReactions: true,
        enablePhotos: true,
        donationSettings: {},
        liveStreamSettings: {},
        visitorVisibility: { posts: true, calendar: true, sermons: true, podcasts: true, books: true, prayerWall: true },
      } as any,
      update: {
        visitorVisibility: {
          posts: true,
          calendar: true,
          sermons: true,
          podcasts: true,
          books: true,
          prayerWall: true,
        } as any,
      },
    });
  } catch (err) {
    // ignore failures here; seeding should continue even if settings upsert fails
  }

  return tenant;
}

// Create or return existing user (idempotent by email). Also creates a profile if missing.
export async function createOrGetUser(prisma: PrismaClient, user: UserArchetype, opts?: { password?: string }) {
  const pw = opts?.password ?? 'password';
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    // ensure profile exists
    const profile = await prisma.userProfile.findFirst({ where: { userId: existing.id } });
    if (!profile) {
      await prisma.userProfile.create({ data: { userId: existing.id, displayName: user.displayName, bio: user.bio, avatarUrl: avatar(user.email) } });
    }
    return existing;
  }

  const passwordHash = await hashPassword(pw);
  const created = await prisma.user.create({
    data: {
      email: user.email,
      password: passwordHash,
      profile: {
        create: { displayName: user.displayName, bio: user.bio, avatarUrl: avatar(user.email) },
      },
    },
  });

  return created;
}

// Ensure membership for a user in a tenant (idempotent)
export async function ensureMembership(prisma: PrismaClient, userId: string | number, tenantId: string | number, role: 'MEMBER' | 'STAFF' | 'CLERGY' | 'MODERATOR' | 'ADMIN' = 'MEMBER') {
  const uid = String(userId);
  const tid = String(tenantId);
  let membership = await prisma.userTenantMembership.findFirst({ where: { userId: uid, tenantId: tid } });
  if (!membership) {
    membership = await prisma.userTenantMembership.create({ data: { userId: uid, tenantId: tid, status: 'APPROVED' as any } });
  }
  // Ensure the role row exists
  const existingRole = await prisma.userTenantRole.findFirst({ where: { membershipId: membership.id, role: role as any } });
  if (!existingRole) {
    await prisma.userTenantRole.create({ data: { membershipId: membership.id, role: role as any, isPrimary: false } });
  }
  return membership;
}

// Create users for a tenant from archetypes; returns map of email->user
export async function createUsersForTenant(prisma: PrismaClient, tenantId: string | number, users: UserArchetype[], opts?: { password?: string }) {
  const tid = String(tenantId);
  const userMap: Record<string, any> = {};
  for (const u of users) {
    const created = await createOrGetUser(prisma, u, { password: opts?.password });
    await ensureMembership(prisma, created.id, tid, 'MEMBER');
    userMap[u.email] = created;
  }
  return userMap;
}

// Deterministically pick 'count' cross-tenant user ids for a given tenant using seeded PRNG.
// `tenantUserPools` should be a map tenantId -> array of userIds available in that tenant.
export function pickDeterministicCrossMembers(tenantSlug: string, tenantUserPools: Record<string, string[]>, count = 2) {
  const tenantIds = Object.keys(tenantUserPools);
  const seed = hashStringToInt(tenantSlug);
  const rnd = mulberry32(seed);
  const picks: string[] = [];
  const availableTenantIds = tenantIds.filter((id) => tenantUserPools[id] && tenantUserPools[id].length > 0);
  if (availableTenantIds.length === 0) return picks;
  while (picks.length < count) {
    const tIdx = Math.floor(rnd() * availableTenantIds.length);
    const tid = availableTenantIds[tIdx];
    const users = tenantUserPools[tid];
    if (!users || users.length === 0) continue;
    const uIdx = Math.floor(rnd() * users.length);
    const uid = users[uIdx];
    if (!picks.includes(uid)) picks.push(uid);
  }
  return picks;
}

// Generic batch helper: call `createFn` on slices of items.
export async function batchRun<T>(items: T[], createFn: (batch: T[]) => Promise<any>, batchSize = 50) {
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    await createFn(slice);
  }
}

export async function createConversationsForTenant(prisma: PrismaClient, tenantId: string | number, channelNames: string[], creatorUserId?: string | number) {
  const created: any[] = [];
  const tid = String(tenantId);
  for (const n of channelNames) {
    const convo = await prisma.conversation.create({ data: { tenantId: tid, name: n, kind: 'CHANNEL' as any, scope: 'TENANT' as any } as any });
    created.push(convo);
  }
    return created;
}

export async function postMessage(prisma: PrismaClient, conversationId: string | number, authorId: string | number, text: string) {
  return prisma.chatMessage.create({ data: { conversationId: String(conversationId), userId: String(authorId), text } as any });
}

// --- Additional content helpers ---

export async function createPostsForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const created: any[] = [];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const post = await prisma.post.create({ data: {
      tenantId: tid,
      authorUserId: author,
      type: 'BLOG',
      title: `Seeded Post ${i + 1}`,
      body: `This is seeded sample post #${i + 1} for tenant ${tid}`,
      isPublished: true,
    } as any });
    created.push(post);
  }
  return created;
}

export async function createProfilePostsForUsers(prisma: PrismaClient, tenantId: string | number, userIds: Array<string | number>, countPerUser = 2) {
  const created: any[] = [];
  for (const uid of userIds) {
    for (let i = 0; i < countPerUser; i++) {
      const p = await prisma.profilePost.create({ data: {
        userId: String(uid),
        type: 'TEXT' as any,
        content: `Profile post ${i + 1} by ${String(uid)}`,
        privacy: 'PUBLIC' as any,
      } as any });
      created.push(p);
    }
  }
  return created;
}

export async function createEventsForTenant(prisma: PrismaClient, tenantId: string | number, creatorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const events: any[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const creator = String(creatorIds[i % creatorIds.length]);
    const start = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const ev = await prisma.event.create({ data: {
      tenantId: tid,
      createdByUserId: creator,
      title: `Seeded Event ${i + 1}`,
      description: `Seed event ${i + 1}`,
      startDateTime: start,
      endDateTime: end,
      locationText: 'Community Hall',
      isOnline: false,
    } as any });
    // RSVP a handful
    for (let r = 0; r < Math.min(3, creatorIds.length); r++) {
      const uid = String(creatorIds[(i + r) % creatorIds.length]);
      try { await prisma.eventRSVP.create({ data: { userId: uid, eventId: ev.id, status: 'GOING' as any } }); } catch (e) { }
    }
    events.push(ev);
  }
  return events;
}

export async function createSmallGroupsForTenant(prisma: PrismaClient, tenantId: string | number, leaderIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const groups: any[] = [];
  for (let i = 0; i < count; i++) {
    const leader = String(leaderIds[i % leaderIds.length]);
    const g = await prisma.smallGroup.create({ data: {
      tenantId: tid,
      name: `Seeded Small Group ${i + 1}`,
      description: `A seeded small group ${i + 1}`,
      leaderUserId: leader,
      isPublic: true,
      status: 'OPEN' as any,
    } as any });
    // add a couple members
    for (let m = 0; m < Math.min(3, leaderIds.length); m++) {
      const uid = String(leaderIds[(i + m) % leaderIds.length]);
      try { await prisma.smallGroupMembership.create({ data: { groupId: g.id, userId: uid, role: 'MEMBER' as any, status: 'APPROVED' as any } }); } catch (e) { }
    }
    groups.push(g);
  }
  return groups;
}

export async function createMediaItemsForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const created: any[] = [];
  // Create sermon videos as YouTube links (deterministic picks)
  const sampleYouTubeIds = ['dQw4w9WgXcQ', 'M7lc1UVf-VE', 'E7wJTI-1dvQ', '3JZ_D3ELwOQ', 'kXYiU_JCYtU'];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const yt = sampleYouTubeIds[(hashStringToInt(`${tid}-${i}`) % sampleYouTubeIds.length)];
    const embed = `https://www.youtube.com/watch?v=${yt}`;
    const mi = await prisma.mediaItem.create({ data: {
      tenantId: tid,
      authorUserId: author,
      type: 'SERMON_VIDEO',
      title: `Seeded Sermon ${i + 1}`,
      description: `Sermon video ${i + 1}`,
      embedUrl: embed,
    } as any });
    created.push(mi);
  }
  return created;
}

export async function createPhotosForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 8) {
  const tid = String(tenantId);
  const created: any[] = [];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const url = photo(`${tid}-photo-${i}`);
    const mi = await prisma.mediaItem.create({ data: {
      tenantId: tid,
      authorUserId: author,
      type: 'IMAGE',
      title: `Photo ${i + 1}`,
      description: `Seeded photo ${i + 1}`,
      embedUrl: url,
    } as any });
    created.push(mi);
  }
  return created;
}

// Create photo MediaItems that point to locally stored PNGs under /seed/photos/<tenantSlug>/photo-#.png
export async function createLocalPhotosForTenant(prisma: PrismaClient, tenantId: string | number, tenantSlug: string, authorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const created: any[] = [];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const url = `/seed/photos/${tenantSlug}/photo-${i + 1}.png`;
    try {
      const mi = await prisma.mediaItem.create({ data: {
        tenantId: tid,
        authorUserId: author,
        type: 'IMAGE',
        title: `Local Photo ${i + 1}`,
        description: `Local seeded photo ${i + 1}`,
        embedUrl: url,
        storageKey: `seed/photos/${tenantSlug}/photo-${i + 1}.png`,
        mimeType: 'image/png',
      } as any });
      created.push(mi);
    } catch (e) {
      // ignore create errors (idempotency on repeated runs may cause duplicates)
    }
  }
  return created;
}

export async function createPodcastsForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 4) {
  const tid = String(tenantId);
  const created: any[] = [];
  const sampleAudio = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const audio = sampleAudio[i % sampleAudio.length];
    const pod = await prisma.podcast.create({ data: {
      tenantId: tid,
      authorUserId: author,
      title: `Seeded Podcast ${i + 1}`,
      description: `Podcast episode ${i + 1}`,
      audioUrl: audio,
      imageUrl: photo(`${tid}-podcast-${i}`),
      isPublished: true,
    } as any });
    created.push(pod);
  }
  return created;
}

export async function createBooksForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 4) {
  const tid = String(tenantId);
  const created: any[] = [];
  for (let i = 0; i < count; i++) {
    const author = String(authorIds[i % authorIds.length]);
    const book = await prisma.book.create({ data: {
      tenantId: tid,
      authorUserId: author,
      title: `Seeded Book ${i + 1}`,
      authorName: `Author ${i + 1}`,
      description: `Description for book ${i + 1}`,
      imageUrl: photo(`${tid}-book-${i}`),
      pdfUrl: `https://example.com/${tid}-book-${i}.pdf`,
      isPublished: true,
    } as any });
    created.push(book);
  }
  return created;
}

export async function createFacilitiesForTenant(prisma: PrismaClient, tenantId: string | number, count = 3) {
  const tid = String(tenantId);
  const list: any[] = [];
  for (let i = 0; i < count; i++) {
    const f = await prisma.facility.create({ data: {
      tenantId: tid,
      name: `Room ${i + 1}`,
      type: 'ROOM' as any,
      capacity: 30,
      imageUrl: photo(`${tid}-facility-${i}`),
    } as any });
    list.push(f);
  }
  return list;
}

export async function createDonationRecordsForTenant(prisma: PrismaClient, tenantId: string | number, donorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const recs: any[] = [];
  for (let i = 0; i < count; i++) {
    const uid = String(donorIds[i % donorIds.length]);
    const rec = await prisma.donationRecord.create({ data: {
      tenantId: tid,
      userId: uid,
      displayName: `Donor ${i + 1}`,
      amount: 25 + i * 10,
      currency: 'USD',
    } as any });
    recs.push(rec);
  }
  return recs;
}

export async function createVolunteerNeedsForTenant(prisma: PrismaClient, tenantId: string | number, creatorIds: Array<string | number>, count = 3) {
  const tid = String(tenantId);
  const needs: any[] = [];
  for (let i = 0; i < count; i++) {
    const creator = String(creatorIds[i % creatorIds.length]);
    const date = new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000);
    const need = await prisma.volunteerNeed.create({ data: {
      tenantId: tid,
      title: `Volunteer Need ${i + 1}`,
      description: `Help needed for event ${i + 1}`,
      date,
      slotsNeeded: 3,
    } as any });
    // signup one person
    try { await prisma.volunteerSignup.create({ data: { needId: need.id, userId: creator, status: 'CONFIRMED' as any } }); } catch (e) { }
    needs.push(need);
  }
  return needs;
}

export async function createResourceItemsForTenant(prisma: PrismaClient, tenantId: string | number, uploaderIds: Array<string | number>, count = 4) {
  const tid = String(tenantId);
  const items: any[] = [];
  for (let i = 0; i < count; i++) {
    const uid = String(uploaderIds[i % uploaderIds.length]);
    const it = await prisma.resourceItem.create({ data: {
      tenantId: tid,
      uploaderUserId: uid,
      title: `Resource ${i + 1}`,
      description: `A helpful resource ${i + 1}`,
      fileUrl: photo(`${tid}-resource-${i}`),
      fileType: 'PDF' as any,
      visibility: 'PUBLIC' as any,
    } as any });
    items.push(it);
  }
  return items;
}

export async function createCommunityPostsForTenant(prisma: PrismaClient, tenantId: string | number, authorIds: Array<string | number>, count = 5) {
  const tid = String(tenantId);
  const posts: any[] = [];
  for (let i = 0; i < count; i++) {
    const uid = String(authorIds[i % authorIds.length]);
    const p = await prisma.communityPost.create({ data: {
      tenantId: tid,
      authorUserId: uid,
      type: 'PRAYER_REQUEST' as any,
      body: `Prayer request ${i + 1}`,
      isAnonymous: false,
      status: 'PUBLISHED' as any,
    } as any });
    posts.push(p);
  }
  return posts;
}

export async function createDirectMessagesBetweenUsers(prisma: PrismaClient, userPairs: Array<[string | number, string | number]>, messagesEach = 3) {
  const created: any[] = [];
  for (const [a, b] of userPairs) {
    // create a DM conversation
    const convo = await prisma.conversation.create({ data: { isDirectMessage: true, scope: 'GLOBAL' as any } as any });
    try { await prisma.conversationParticipant.create({ data: { conversationId: convo.id, userId: String(a) } }); } catch (e) {}
    try { await prisma.conversationParticipant.create({ data: { conversationId: convo.id, userId: String(b) } }); } catch (e) {}
    for (let i = 0; i < messagesEach; i++) {
      const author = String(i % 2 === 0 ? a : b);
      const m = await prisma.chatMessage.create({ data: { conversationId: convo.id, userId: author, text: `DM seeded msg ${i + 1}` } as any });
      created.push(m);
    }
  }
  return created;
}

// --- More varied content helpers ---

export async function addCommentsToPosts(prisma: PrismaClient, tenantId: string | number, posts: Array<any>, userIds: Array<string | number>, commentsPerPost = 3) {
  const tid = String(tenantId);
  for (const post of posts) {
    const existing = await prisma.postComment.count({ where: { postId: post.id } });
    const toCreate = Math.max(0, commentsPerPost - existing);
    for (let i = 0; i < toCreate; i++) {
      const author = String(userIds[(i + existing) % userIds.length]);
      await prisma.postComment.create({ data: { tenantId: tid, postId: post.id, authorUserId: author, body: `Comment ${i + 1} on ${post.title}` } as any });
    }
  }
}

export async function addReactionsToProfilePosts(prisma: PrismaClient, profilePostIds: string[], userIds: string[], reactionsPerPost = 3) {
  for (const pid of profilePostIds) {
    const existing = await prisma.profilePostReaction.count({ where: { postId: pid } });
    const toCreate = Math.max(0, reactionsPerPost - existing);
    for (let i = 0; i < toCreate; i++) {
      const uid = userIds[i % userIds.length];
      try { await prisma.profilePostReaction.create({ data: { postId: pid, userId: uid, type: 'LIKE' as any } }); } catch (e) { }
    }
  }
}

export async function addMediaToProfilePosts(prisma: PrismaClient, profilePostIds: string[], tenantId: string | number) {
  const tid = String(tenantId);
  for (const pid of profilePostIds) {
    const existing = await prisma.profilePostMedia.count({ where: { postId: pid } });
    if (existing >= 1) continue;
    await prisma.profilePostMedia.create({ data: { postId: pid, type: 'IMAGE' as any, url: photo(`${tid}-profilepost-${pid}`), storageKey: '', mimeType: 'image/png', fileSize: 12345 } as any });
  }
}

export async function createFacilityBookingsForEvents(prisma: PrismaClient, tenantId: string | number, facilityIds: string[], events: Array<any>) {
  const tid = String(tenantId);
  for (const ev of events) {
    // skip if event already has a booking
    const existing = await prisma.facilityBooking.findFirst({ where: { eventId: ev.id } });
    if (existing) continue;
    if (facilityIds.length === 0) break;
    const facilityId = facilityIds[Math.floor(Math.random() * facilityIds.length)];
    const startAt = ev.startDateTime ? new Date(ev.startDateTime) : new Date();
    const endAt = ev.endDateTime ? new Date(ev.endDateTime) : new Date(startAt.getTime() + 60 * 60 * 1000);
    try {
      await prisma.facilityBooking.create({ data: { tenantId: tid, facilityId, eventId: ev.id, requestedById: ev.createdByUserId || '', startAt, endAt, purpose: `Booking for ${ev.title}` } as any });
    } catch (e) { }
  }
}

export async function createSmallGroupAnnouncements(prisma: PrismaClient, groupIds: string[], authorIds: string[]) {
  for (const gid of groupIds) {
    const existing = await prisma.smallGroupAnnouncement.count({ where: { groupId: gid } });
    if (existing >= 2) continue;
    for (let i = 0; i < 2 - existing; i++) {
      const author = authorIds[i % authorIds.length];
      await prisma.smallGroupAnnouncement.create({ data: { tenantId: (await prisma.smallGroup.findUnique({ where: { id: gid } }))!.tenantId, groupId: gid, authorUserId: author, title: `Announcement ${i + 1}`, body: `Announcement body ${i + 1}` } as any });
    }
  }
}

export async function addCommentsToProfilePosts(prisma: PrismaClient, profilePostIds: string[], userIds: string[], commentsEach = 2) {
  for (const pid of profilePostIds) {
    const existing = await prisma.profilePostComment.count({ where: { postId: pid } });
    const toCreate = Math.max(0, commentsEach - existing);
    for (let i = 0; i < toCreate; i++) {
      const uid = userIds[i % userIds.length];
      try { await prisma.profilePostComment.create({ data: { postId: pid, userId: uid, content: `Nice post! (${i + 1})` } as any }); } catch (e) {}
    }
  }
}


const seedHelpers = {
  avatar,
  photo,
  banner,
  hashPassword,
  ensureTenant,
  createOrGetUser,
  ensureMembership,
  createUsersForTenant,
  pickDeterministicCrossMembers,
  batchRun,
  createConversationsForTenant,
  postMessage,
  createLocalPhotosForTenant,
};

export default seedHelpers;
