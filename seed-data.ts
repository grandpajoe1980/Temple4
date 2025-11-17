/**
 * @file seed-data.ts
 * @description
 * This file serves as the **mock backend** for the Temple platform prototype.
 * It simulates a database, service layer, and API endpoints, allowing the frontend
 * to be developed and tested independently.
 *
 * It adheres to the architecture specified in `backend.md`.
 *
 * - **Database Simulation:** The `store` object acts as an in-memory database.
 *   The `loadState()` and `saveState()` functions provide persistence via browser
 *   localStorage, simulating a persistent database connection.
 * - **Data Models:** The data structures used are defined in `types.ts` and directly
 *   correspond to the Prisma schema outlined in `backend.md`.
 * - **Service Layer / API Simulation:** Each exported function (e.g., `getPostsForTenant`,
 *   `updateUserProfile`) represents a service method that would be called by an API
 *   route handler. The comments for each function explicitly map it to the
 *   intended API endpoint (e.g., "Simulates: GET /api/tenants/:id/posts").
 */

import type { User, Tenant, Post, Event, MediaItem, UserTenantMembership, PostWithAuthor, EnrichedMember, EventWithCreator, EnrichedMediaItem, AuditLog, ChatMessage, EnrichedChatMessage, Conversation, ConversationParticipant, EnrichedConversation, UserTenantRole, UserProfile, UserPrivacySettings, TenantFeaturePermissions, NotificationPreferences, AccountSettings, Notification, DonationRecord, EnrichedDonationRecord, VolunteerNeed, VolunteerSignup, EnrichedSignup, EnrichedVolunteerNeed, SmallGroup, SmallGroupMembership, EnrichedGroupMember, EnrichedSmallGroup, CommunityPost, EnrichedCommunityPost, ResourceItem, EnrichedResourceItem, ContactSubmission } from './types';
import { MembershipApprovalMode, TenantRole, ActionType, MembershipStatus, SmallGroupRole, CommunityPostType, CommunityPostStatus, ResourceVisibility, FileType, ContactSubmissionStatus, VolunteerStatus } from './types';
import { getInitialTenant } from './constants';
import { can, canDeleteMessage } from './lib/permissions';

// --- DATA STORE & PERSISTENCE ---

interface AppData {
  users: User[];
  tenants: Tenant[];
  memberships: UserTenantMembership[];
  posts: Post[];
  events: Event[];
  mediaItems: MediaItem[];
  conversations: Conversation[];
  conversationParticipants: ConversationParticipant[];
  chatMessages: ChatMessage[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  donationRecords: DonationRecord[];
  volunteerNeeds: VolunteerNeed[];
  volunteerSignups: VolunteerSignup[];
  smallGroups: SmallGroup[];
  smallGroupMemberships: SmallGroupMembership[];
  communityPosts: CommunityPost[];
  resourceItems: ResourceItem[];
  contactSubmissions: ContactSubmission[];
}

const LOCAL_STORAGE_KEY = 'temple-app-data';

const dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value)) {
        return new Date(value);
    }
    return value;
};

/**
 * Simulates writing to the database by saving the entire data store to localStorage.
 * @param data The complete application data object.
 */
const saveState = (data: AppData) => {
  try {
    const serializedState = JSON.stringify(data);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save state to localStorage", error);
  }
};

/**
 * Simulates reading from the database by loading the data store from localStorage.
 * If no data is found, it initializes with default seed data.
 * @returns The complete application data object.
 */
const loadState = (): AppData => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      const defaultData = getDefaultData();
      saveState(defaultData);
      return defaultData;
    }
    const data = JSON.parse(serializedState, dateReviver);
    // Add default empty arrays for new properties to avoid crashes on old data
    if (!data.volunteerNeeds) data.volunteerNeeds = [];
    if (!data.volunteerSignups) data.volunteerSignups = [];
    if (!data.smallGroups) data.smallGroups = [];
    if (!data.smallGroupMemberships) data.smallGroupMemberships = [];
    if (!data.communityPosts) data.communityPosts = [];
    if (!data.resourceItems) data.resourceItems = [];
    if (!data.contactSubmissions) data.contactSubmissions = [];

    // Add defaults for new settings to prevent crashes on old data structures
    const initialSettings = getInitialTenant().settings;
    data.tenants.forEach((tenant: Tenant) => {
        if (tenant.settings.enableLiveStream === undefined) {
            tenant.settings.enableLiveStream = initialSettings.enableLiveStream;
        }
        if (tenant.settings.liveStreamSettings === undefined) {
            tenant.settings.liveStreamSettings = initialSettings.liveStreamSettings;
        }
        if (tenant.settings.enablePrayerWall === undefined) {
            tenant.settings.enablePrayerWall = initialSettings.enablePrayerWall;
        }
        if (tenant.settings.visitorVisibility.prayerWall === undefined) {
            tenant.settings.visitorVisibility.prayerWall = initialSettings.visitorVisibility.prayerWall;
        }
        if (tenant.settings.enableResourceCenter === undefined) {
            tenant.settings.enableResourceCenter = initialSettings.enableResourceCenter;
        }
        if (!tenant.address.street) {
            tenant.address.street = '';
        }
    });

    return data;
  } catch (error) {
    console.error("Could not load state from localStorage", error);
    return getDefaultData();
  }
};


// --- INITIAL SEED DATA (Used only on first load) ---

const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    newAnnouncement: true,
    newEvent: true,
    directMessage: true,
    groupChatMessage: false,
    membershipUpdate: true,
  },
};

const defaultAccountSettings: AccountSettings = {
    timezonePreference: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    languagePreference: 'en-US',
};

/**
 * Generates the initial dataset if no data exists in localStorage.
 * This function acts as the initial database migration or seed script.
 */
const getDefaultData = (): AppData => {
    const initialSuperAdmin: User = {
      id: 'user-0',
      email: 'admin@temple.com',
      password: 'admin',
      isSuperAdmin: true,
      profile: {
        displayName: 'Platform Admin',
        avatarUrl: 'https://i.pravatar.cc/48?u=user-0',
      },
      privacySettings: { showAffiliations: true },
      accountSettings: defaultAccountSettings,
      notificationPreferences: defaultNotificationPreferences,
    };

    const initialUsers: User[] = [
      initialSuperAdmin,
      { 
        id: 'user-1', email: 'michael@example.com', isSuperAdmin: false, password: 'password',
        profile: { displayName: 'Michael Scott', avatarUrl: 'https://i.pravatar.cc/48?u=user-1', bio: 'World\'s Best Boss. Enthusiastic leader with a passion for paper.', locationCity: 'Scranton', locationCountry: 'PA', languages: ['English'] },
        privacySettings: { showAffiliations: true },
        accountSettings: defaultAccountSettings,
        notificationPreferences: defaultNotificationPreferences,
      },
      { 
        id: 'user-2', email: 'dwight@example.com', isSuperAdmin: false, password: 'password',
        profile: { displayName: 'Dwight Schrute', avatarUrl: 'https://i.pravatar.cc/48?u=user-2', bio: 'Assistant to the Regional Manager. Beekeeper, martial artist, and safety officer.', locationCity: 'Scranton', locationCountry: 'PA', languages: ['English', 'German'] },
        privacySettings: { showAffiliations: true },
        accountSettings: defaultAccountSettings,
        notificationPreferences: defaultNotificationPreferences,
      },
      { 
        id: 'user-3', email: 'jim@example.com', isSuperAdmin: false, password: 'password',
        profile: { displayName: 'Jim Halpert', avatarUrl: 'https://i.pravatar.cc/48?u=user-3', bio: 'Sales representative. Enjoys a good prank.', locationCity: 'Philadelphia', locationCountry: 'PA', languages: ['English'] },
        privacySettings: { showAffiliations: false },
        accountSettings: defaultAccountSettings,
        notificationPreferences: defaultNotificationPreferences,
      },
      { 
        id: 'user-4', email: 'pam@example.com', isSuperAdmin: false, password: 'password',
        profile: { displayName: 'Pam Beesly', avatarUrl: 'https://i.pravatar.cc/48?u=user-4', bio: 'Office administrator and artist.', locationCity: 'Scranton', locationCountry: 'PA', languages: ['English'] },
        privacySettings: { showAffiliations: true },
        accountSettings: defaultAccountSettings,
        notificationPreferences: defaultNotificationPreferences,
      },
      { 
        id: 'user-5', email: 'jane@example.com', isSuperAdmin: false, password: 'password',
        profile: { displayName: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/48?u=user-5', bio: 'Meditator and student of Zen.', locationCity: 'Portland', locationCountry: 'OR', languages: ['English'] },
        privacySettings: { showAffiliations: true },
        accountSettings: {
            ...defaultAccountSettings,
            timezonePreference: 'America/Los_Angeles',
        },
        notificationPreferences: defaultNotificationPreferences,
      },
      ...Array.from({ length: 21 }, (_, i) => {
        const id = `user-${6 + i}`;
        const names = ['Samuel Drake', 'Elara Vance', 'Finn Carver', 'Isla Rose', 'Caleb Stone', 'Aria Cove', 'Nathan Tide', 'Seraphina Gale', 'Liam Harbor', 'Mira Sands', 'Owen Reef', 'Clara Finch', 'Felix Anchor', 'Stella Maris', 'Jasper Flint', 'Willa Crest', 'Gideon Bay', 'Pearl Esker', 'Ronan Ford', 'Thea Dune'];
        const bios = ['Keeper of the Light.', 'First Mate and historian.', 'Chandler and provisioner.', 'Navigator and stargazer.', 'Stonemason.', 'Musician and singer.', 'Fisherman.', 'Weaver of nets and tales.', 'Shipwright.', 'Cartographer.', 'Marine biologist.', 'Ornithologist.', 'Retired captain.', 'Poet and dreamer.', 'Geologist.', 'Chef.', 'Boat builder.', 'Jewelry maker.', 'Linguist.', 'Botanist.'];
        const name = names[i] || `User ${6+i}`;
        const emailName = name.split(' ')[0].toLowerCase();
        return {
          id,
          email: `${emailName}@sea.com`,
          isSuperAdmin: false,
          password: 'password',
          profile: {
            displayName: name,
            avatarUrl: `https://i.pravatar.cc/48?u=${id}`,
            bio: bios[i] || 'A member of the flock.',
            locationCity: 'Newport', locationCountry: 'RI',
            languages: ['English']
          },
          privacySettings: { showAffiliations: true },
          accountSettings: defaultAccountSettings,
          notificationPreferences: defaultNotificationPreferences,
        };
      }),
    ];

    const tenant1Initial = getInitialTenant();
    const tenant2Initial = getInitialTenant();

    const initialTenants: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'Grace Community Fellowship',
        slug: 'grace-community',
        creed: 'Non-Denominational Christianity',
        address: { street: '456 Oak Avenue', city: 'Sunnyvale', state: 'CA', country: 'USA', postalCode: '94086' },
        contactEmail: 'contact@gracecommunity.org',
        phoneNumber: '(408) 555-1234',
        description: 'A welcoming community focused on modern worship and local outreach.',
        ...tenant1Initial,
        branding: {
            ...tenant1Initial.branding,
            logoUrl: 'https://tailwindui.com/img/logos/workflow-mark-blue-600.svg',
            primaryColor: '#3B82F6', // Blue
            accentColor: '#10B981', // Green
        },
        settings: {
            ...tenant1Initial.settings,
            membershipApprovalMode: MembershipApprovalMode.APPROVAL_REQUIRED,
            enableDonations: true,
            donationSettings: {
              mode: 'INTEGRATED',
              externalUrl: '',
              currency: 'USD',
              suggestedAmounts: [20, 50, 100, 250],
              allowCustomAmounts: true,
              leaderboardEnabled: true,
              leaderboardVisibility: 'MEMBERS_ONLY',
              leaderboardTimeframe: 'ALL_TIME',
            },
        }
      },
      {
        id: 'tenant-2',
        name: 'Oakwood Buddhist Center',
        slug: 'oakwood-buddhist-center',
        creed: 'Zen Buddhism',
        address: { street: '789 Pine Street', city: 'Portland', state: 'OR', country: 'USA', postalCode: '97201' },
        contactEmail: 'info@oakwoodzen.com',
        phoneNumber: '(503) 555-5678',
        description: 'A center for mindfulness, meditation, and the study of Zen principles.',
        ...tenant2Initial,
         branding: {
            ...tenant2Initial.branding,
            logoUrl: 'https://tailwindui.com/img/logos/workflow-mark-amber-600.svg',
            primaryColor: '#D97706', // Amber
            accentColor: '#DC2626', // Red
        },
        settings: {
            ...tenant2Initial.settings,
            enableSermons: false, // Disabling a feature
            enablePodcasts: true,
            enableBooks: true,
        }
      },
       {
        id: 'tenant-3',
        name: 'The Lighthouse Keeper',
        slug: 'lighthouse-keeper',
        creed: 'Maritime Gospel',
        address: { street: '1 Lighthouse Road', city: 'Newport', state: 'RI', country: 'USA', postalCode: '02840' },
        contactEmail: 'keeper@lighthouse.org',
        phoneNumber: '(401) 555-9012',
        description: 'A stoic place of worship for those who tend the light and navigate by the stars.',
        ...getInitialTenant(),
        settings: {
            ...getInitialTenant().settings,
            enableDonations: true,
            enableVolunteering: true,
            enablePrayerWall: true,
            enableResourceCenter: true,
            donationSettings: {
              mode: 'EXTERNAL',
              externalUrl: 'https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID',
              currency: 'USD',
              suggestedAmounts: [5, 15, 30],
              allowCustomAmounts: false,
              leaderboardEnabled: false,
              leaderboardVisibility: 'MEMBERS_ONLY',
              leaderboardTimeframe: 'ALL_TIME',
            },
        }
      }
    ];
    
    const initialMemberships: UserTenantMembership[] = [
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', status: MembershipStatus.APPROVED, displayName: 'Pastor Mike', roles: [{id: 'tr-1', role: TenantRole.ADMIN, displayTitle: 'Lead Pastor', isPrimary: true }] },
      { id: 'm-2', userId: 'user-2', tenantId: 'tenant-1', status: MembershipStatus.APPROVED, roles: [{id: 'tr-2', role: TenantRole.STAFF, displayTitle: 'Worship Leader', isPrimary: true }] },
      { id: 'm-3', userId: 'user-3', tenantId: 'tenant-1', status: MembershipStatus.APPROVED, roles: [{id: 'tr-3', role: TenantRole.MEMBER, isPrimary: true}] },
      { id: 'm-4', userId: 'user-4', tenantId: 'tenant-1', status: MembershipStatus.REQUESTED, roles: [{id: 'tr-4', role: TenantRole.MEMBER, isPrimary: true}] },
      { id: 'm-5', userId: 'user-5', tenantId: 'tenant-2', status: MembershipStatus.APPROVED, roles: [{id: 'tr-5', role: TenantRole.ADMIN, displayTitle: 'Sensei', isPrimary: true }] },
      { id: 'm-6', userId: 'user-3', tenantId: 'tenant-2', status: MembershipStatus.APPROVED, displayName: 'Brother Jim', roles: [{id: 'tr-6', role: TenantRole.MODERATOR, displayTitle: 'Senior Student', isPrimary: true }] },
      { id: 'm-7', userId: 'user-4', tenantId: 'tenant-2', status: MembershipStatus.APPROVED, roles: [{id: 'tr-7', role: TenantRole.MEMBER, isPrimary: true}] },
      { id: 'm-8', userId: 'user-6', tenantId: 'tenant-3', status: MembershipStatus.APPROVED, roles: [{id: 'tr-8', role: TenantRole.ADMIN, displayTitle: 'The Keeper', isPrimary: true}] },
      { id: 'm-9', userId: 'user-7', tenantId: 'tenant-3', status: MembershipStatus.APPROVED, roles: [{id: 'tr-9', role: TenantRole.STAFF, displayTitle: 'First Mate', isPrimary: true}] },
      { id: 'm-10', userId: 'user-8', tenantId: 'tenant-3', status: MembershipStatus.APPROVED, roles: [{id: 'tr-10', role: TenantRole.STAFF, displayTitle: 'Chandler', isPrimary: true}] },
      { id: 'm-11', userId: 'user-9', tenantId: 'tenant-3', status: MembershipStatus.APPROVED, roles: [{id: 'tr-11', role: TenantRole.MODERATOR, displayTitle: 'Navigator', isPrimary: true}] },
      ...Array.from({ length: 16 }, (_, i) => ({
          id: `m-${12 + i}`,
          userId: `user-${10 + i}`,
          tenantId: 'tenant-3',
          status: MembershipStatus.APPROVED,
          roles: [{ id: `tr-${12+i}`, role: TenantRole.MEMBER, isPrimary: true }]
      }))
    ];
    
    const initialPosts: Post[] = [
        { id: 'post-1', tenantId: 'tenant-1', authorUserId: 'user-1', type: 'ANNOUNCEMENT', title: 'Annual Community Picnic', body: 'Join us this Saturday for fun, food, and fellowship at the city park. We will have games for all ages and a potluck lunch. Please sign up to bring a dish!', isPublished: true, publishedAt: new Date('2024-07-20T10:00:00Z') },
        { id: 'post-2', tenantId: 'tenant-2', authorUserId: 'user-5', type: 'BOOK', title: 'The Art of Stillness: Chapter 1', body: 'The first step in the art of stillness is to find your anchor. For many, this is the breath. It is a constant, a rhythm that exists without conscious effort. Observe it. Feel the cool air enter your nostrils, fill your lungs, and the warm air as it departs. Do not try to change it. Simply notice. This act of noticing is the foundation upon which all mindfulness is built. It is returning home to the present moment, again and again.', isPublished: true, publishedAt: new Date('2024-07-18T14:00:00Z') },
        { id: 'post-3', tenantId: 'tenant-1', authorUserId: 'user-2', type: 'BLOG', title: 'Reflections on Last Sunday\'s Worship', body: 'The energy during last Sunday\'s service was truly special. The choir\'s performance of "Amazing Grace" moved many of us...', isPublished: true, publishedAt: new Date('2024-07-22T09:00:00Z') },
        { id: 'post-4', tenantId: 'tenant-1', authorUserId: 'user-1', type: 'ANNOUNCEMENT', title: 'Call for Volunteers', body: 'We are looking for volunteers to help with the upcoming youth group retreat. Please see Pastor Michael if you are interested in chaperoning.', isPublished: true, publishedAt: new Date('2024-07-25T11:00:00Z') },
        { id: 'post-5', tenantId: 'tenant-3', authorUserId: 'user-6', type: 'BLOG', title: "Keeper's Log: A Stormy Night", body: "The waves crashed against the rocks with a fury I've seldom seen. The lamp, our steadfast beacon, cut through the rain and fog, a promise of safety in the tempest. It is in these moments we are reminded of the power of a single, constant light.", isPublished: true, publishedAt: new Date('2025-10-15T22:00:00Z') },
        { id: 'post-6', tenantId: 'tenant-3', authorUserId: 'user-7', type: 'ANNOUNCEMENT', title: 'Announcement: New Signal Lamp', body: "Thanks to the diligent work of our members, the new Fresnel lens has been installed. Its beam is brighter and reaches farther than ever before. All are welcome to the lighting ceremony this Friday at dusk.", isPublished: true, publishedAt: new Date('2025-10-28T09:00:00Z') },
        { id: 'post-7', tenantId: 'tenant-3', authorUserId: 'user-9', type: 'BLOG', title: 'Navigating by the Stars', body: "Last night's clear sky offered a perfect view of the constellations. We spoke of Polaris, the North Star, the anchor of the heavens, and how we might find such anchors in our own lives.", isPublished: true, publishedAt: new Date('2025-11-02T11:00:00Z') },
        { id: 'post-8', tenantId: 'tenant-2', authorUserId: 'user-5', type: 'BOOK', title: 'The Art of Stillness: Chapter 2', body: 'Once the breath is established as an anchor, we can begin to observe the mind itself. Thoughts will arise—memories, plans, judgments, worries. The practice is not to stop these thoughts, but to see them for what they are: fleeting mental events. Imagine them as clouds passing in the vast sky of your awareness. You are the sky, not the clouds. Acknowledge them without attachment, and gently return your focus to the breath.', isPublished: true, publishedAt: new Date('2024-07-25T14:00:00Z') },
    ];
    
    const initialEvents: Event[] = [
        { id: 'evt-1', tenantId: 'tenant-1', createdByUserId: 'user-2', title: 'Sunday Service', description: 'Weekly gathering for worship, sermon, and fellowship. All are welcome to attend.', startDateTime: new Date('2024-08-11T10:00:00'), endDateTime: new Date('2024-08-11T11:30:00'), locationText: 'Main Sanctuary', isOnline: false },
        { id: 'evt-2', tenantId: 'tenant-2', createdByUserId: 'user-5', title: 'Evening Zazen', description: 'A quiet session of group sitting meditation (zazen). Instruction is available for beginners.', startDateTime: new Date('2024-08-12T19:00:00'), endDateTime: new Date('2024-08-12T20:00:00'), locationText: 'Zendo Hall', isOnline: false },
        { id: 'evt-3', tenantId: 'tenant-1', createdByUserId: 'user-1', title: 'Youth Group Movie Night', description: 'Pizza and a movie for ages 12-18. We will be watching "The Prince of Egypt".', startDateTime: new Date('2024-08-16T18:30:00'), endDateTime: new Date('2024-08-16T21:00:00'), locationText: 'Youth Hall', isOnline: false },
        { id: 'evt-4', tenantId: 'tenant-2', createdByUserId: 'user-3', title: 'Community Garden Day', description: 'Help us tend to the community vegetable garden. A great way to practice mindfulness and connect with nature.', startDateTime: new Date('2024-08-17T09:00:00'), endDateTime: new Date('2024-08-17T12:00:00'), locationText: 'West Garden', isOnline: false },
        { id: 'evt-5', tenantId: 'tenant-1', createdByUserId: 'user-1', title: 'Online Bible Study', description: 'Join us on Zoom for a study of the book of Romans.', startDateTime: new Date('2024-08-14T19:00:00'), endDateTime: new Date('2024-08-14T20:30:00'), locationText: 'Online', isOnline: true, onlineUrl: 'https://zoom.us/j/1234567890' },
        { id: 'evt-6', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Sermon by the Sea', description: 'A weekly gathering at the foot of the lighthouse to reflect on the week past.', startDateTime: new Date('2025-11-02T09:00:00'), endDateTime: new Date('2025-11-02T10:00:00'), locationText: 'Lighthouse Base', isOnline: false },
        { id: 'evt-7', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Sermon by the Sea', description: 'A weekly gathering at the foot of the lighthouse to reflect on the week past.', startDateTime: new Date('2025-11-09T09:00:00'), endDateTime: new Date('2025-11-09T10:00:00'), locationText: 'Lighthouse Base', isOnline: false },
        { id: 'evt-8', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Sermon by the Sea', description: 'A weekly gathering at the foot of the lighthouse to reflect on the week past.', startDateTime: new Date('2025-11-16T09:00:00'), endDateTime: new Date('2025-11-16T10:00:00'), locationText: 'Lighthouse Base', isOnline: false },
        { id: 'evt-9', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Sermon by the Sea', description: 'A weekly gathering at the foot of the lighthouse to reflect on the week past.', startDateTime: new Date('2025-11-23T09:00:00'), endDateTime: new Date('2025-11-23T10:00:00'), locationText: 'Lighthouse Base', isOnline: false },
        { id: 'evt-10', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Sermon by the Sea', description: 'A weekly gathering at the foot of the lighthouse to reflect on the week past.', startDateTime: new Date('2025-11-30T09:00:00'), endDateTime: new Date('2025-11-30T10:00:00'), locationText: 'Lighthouse Base', isOnline: false },
        { id: 'evt-11', tenantId: 'tenant-3', createdByUserId: 'user-8', title: 'Foghorn Maintenance Day', description: 'A community effort to clean and service the foghorn. Many hands make light work. Coffee and donuts provided.', startDateTime: new Date('2025-11-15T10:00:00'), endDateTime: new Date('2025-11-15T13:00:00'), locationText: 'Engine House', isOnline: false },
        { id: 'evt-12', tenantId: 'tenant-3', createdByUserId: 'user-7', title: 'Sailor\'s Supper (Potluck)', description: 'Share a meal and stories with your fellow congregants. Please bring a dish to share if you are able.', startDateTime: new Date('2025-11-20T18:00:00'), endDateTime: new Date('2025-11-20T20:00:00'), locationText: 'Keeper\'s Quarters', isOnline: false },
        { id: 'evt-13', tenantId: 'tenant-3', createdByUserId: 'user-6', title: 'Annual Blessing of the Fleet', description: 'A special ceremony to wish our local fishermen safety and bounty for the coming year.', startDateTime: new Date('2025-11-27T14:00:00'), endDateTime: new Date('2025-11-27T15:00:00'), locationText: 'Town Pier', isOnline: false },
    ];

    const initialMediaItems: MediaItem[] = [
        { id: 'med-1', tenantId: 'tenant-1', authorUserId: 'user-1', type: 'SERMON_VIDEO', title: 'Sermon on the Mount', description: 'A deep dive into Matthew 5. Exploring the beatitudes and their meaning for us today.', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', publishedAt: new Date('2024-07-21T10:00:00Z') },
        { id: 'med-2', tenantId: 'tenant-2', authorUserId: 'user-5', type: 'PODCAST_AUDIO', title: 'The Eightfold Path', description: 'Exploring the core tenets of the path to enlightenment.', embedUrl: 'https://archive.org/details/Ten-Minute-Podcasts', publishedAt: new Date('2024-07-20T10:00:00Z') },
        { id: 'med-3', tenantId: 'tenant-1', authorUserId: 'user-2', type: 'SERMON_VIDEO', title: 'The Power of Worship', description: 'How worship can transform our perspective and deepen our faith.', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', publishedAt: new Date('2024-07-14T10:00:00Z') },
        { id: 'med-4', tenantId: 'tenant-2', authorUserId: 'user-3', type: 'PODCAST_AUDIO', title: 'Mindful Living in a Busy World', description: 'Practical tips for incorporating mindfulness into your daily routine, even with a hectic schedule.', embedUrl: 'https://archive.org/details/Ten-Minute-Podcasts', publishedAt: new Date('2024-07-27T08:00:00Z') },
        { id: 'med-5', tenantId: 'tenant-3', authorUserId: 'user-6', type: 'SERMON_VIDEO', title: 'The Guiding Light', description: 'A sermon on finding our way through darkness by holding fast to our principles.', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', publishedAt: new Date('2025-11-02T10:00:00Z') },
        { id: 'med-6', tenantId: 'tenant-3', authorUserId: 'user-6', type: 'SERMON_VIDEO', title: 'Navigating Life\'s Waters', description: 'On preparing for inevitable storms and finding safe harbor.', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', publishedAt: new Date('2025-11-09T10:00:00Z') },
    ];

    const initialConversations: Conversation[] = [
        { id: 'conv-dm-1', isDirect: true, tenantId: null, isPrivateGroup: false, createdByUserId: 'user-1', isDefaultChannel: false, createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60000), updatedAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60000) },
        { id: 'conv-dm-2', isDirect: true, tenantId: null, isPrivateGroup: false, createdByUserId: 'user-6', isDefaultChannel: false, createdAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60000), updatedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60000) },
        { id: 'conv-t3-announce', isDirect: false, tenantId: 'tenant-3', isPrivateGroup: false, name: '#announcements', description: 'Official announcements from the Keeper and staff.', createdByUserId: 'user-6', isDefaultChannel: true, createdAt: new Date(new Date().getTime() - 11 * 24 * 60 * 60000), updatedAt: new Date(new Date().getTime() - 11 * 24 * 60 * 60000) },
        { id: 'conv-t3-general', isDirect: false, tenantId: 'tenant-3', isPrivateGroup: false, name: '#general', description: 'General chat for all members of the congregation.', createdByUserId: 'user-6', isDefaultChannel: true, createdAt: new Date(new Date().getTime() - 10 * 24 * 60 * 60000), updatedAt: new Date(new Date().getTime() - 10 * 24 * 60 * 60000) },
        { id: 'conv-t3-maint', isDirect: false, tenantId: 'tenant-3', isPrivateGroup: false, name: '#maintenance', description: 'For coordinating repairs and upkeep of the lighthouse.', createdByUserId: 'user-7', isDefaultChannel: false, createdAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60000), updatedAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60000) },
    ];
    
    const initialParticipants: ConversationParticipant[] = [
        { id: 'cp-1', conversationId: 'conv-dm-1', userId: 'user-1', lastReadMessageId: null },
        { id: 'cp-2', conversationId: 'conv-dm-1', userId: 'user-3', lastReadMessageId: null },
        { id: 'cp-3', conversationId: 'conv-dm-2', userId: 'user-6', lastReadMessageId: null },
        { id: 'cp-4', conversationId: 'conv-dm-2', userId: 'user-7', lastReadMessageId: null },
        ...initialMemberships.filter(m => m.tenantId === 'tenant-3').map((m, i) => ({ id: `cp-a-${i}`, conversationId: 'conv-t3-announce', userId: m.userId, lastReadMessageId: null })),
        ...initialMemberships.filter(m => m.tenantId === 'tenant-3').map((m, i) => ({ id: `cp-g-${i}`, conversationId: 'conv-t3-general', userId: m.userId, lastReadMessageId: null })),
        { id: 'cp-m-1', conversationId: 'conv-t3-maint', userId: 'user-6' },
        { id: 'cp-m-2', conversationId: 'conv-t3-maint', userId: 'user-7' },
        { id: 'cp-m-3', conversationId: 'conv-t3-maint', userId: 'user-8' },
        { id: 'cp-m-4', conversationId: 'conv-t3-maint', userId: 'user-14' },
        { id: 'cp-m-5', conversationId: 'conv-t3-maint', userId: 'user-10' },
    ];

    const initialChatMessages: ChatMessage[] = [
        { id: 'msg-1', conversationId: 'conv-t3-general', userId: 'user-7', text: 'Good morning, everyone. A reminder that the lighting ceremony for the new Fresnel lens is this Friday at dusk.', createdAt: new Date(new Date().getTime() - 10 * 60000), isDeleted: false },
        { id: 'msg-2', conversationId: 'conv-t3-general', userId: 'user-8', text: 'I\'ll be bringing hot cider for the ceremony. Should be a chilly evening!', createdAt: new Date(new Date().getTime() - 9 * 60000), isDeleted: false },
        { id: 'msg-3', conversationId: 'conv-t3-general', userId: 'user-6', text: 'Thank you, Finn. Your generosity is appreciated. The light will shine brighter than ever before.', createdAt: new Date(new Date().getTime() - 8 * 60000), isDeleted: false },
        { id: 'msg-4', conversationId: 'conv-t3-general', userId: 'user-14', text: 'Is there anything needed for the final preparations? I have some free time this afternoon.', createdAt: new Date(new Date().getTime() - 7 * 60000), isDeleted: false },
        { id: 'msg-5', conversationId: 'conv-t3-general', userId: 'user-7', text: 'Thank you, Liam. Could you help Caleb with securing the new mounting brackets? An extra pair of hands would be a great help.', createdAt: new Date(new Date().getTime() - 6 * 60000), isDeleted: false },
        { id: 'msg-6', conversationId: 'conv-t3-general', userId: 'user-10', text: 'Aye, that would be good. The new brackets are heavier than the old ones.', createdAt: new Date(new Date().getTime() - 5 * 60000), isDeleted: false },
        { id: 'msg-7', conversationId: 'conv-t3-general', userId: 'user-14', text: 'On my way.', createdAt: new Date(new Date().getTime() - 4 * 60000), isDeleted: false },
        { id: 'msg-8', conversationId: 'conv-dm-1', userId: 'user-3', text: 'Hey, are you going to the community picnic this weekend?', createdAt: new Date(new Date().getTime() - 20 * 60000), isDeleted: false },
        { id: 'msg-9', conversationId: 'conv-dm-1', userId: 'user-1', text: 'Absolutely! I wouldn\'t miss it. I\'m in charge of the games.', createdAt: new Date(new Date().getTime() - 19 * 60000), isDeleted: false },
        { id: 'msg-10', conversationId: 'conv-t3-maint', userId: 'user-6', text: 'Team, we need to inspect the foghorn wiring before the next storm front moves in. I\'m scheduling it for tomorrow morning.', createdAt: new Date(new Date().getTime() - 15 * 60000), isDeleted: false },
        { id: 'msg-11', conversationId: 'conv-t3-maint', userId: 'user-8', text: 'Understood. I\'ll bring the new insulation wrap.', createdAt: new Date(new Date().getTime() - 14 * 60000), isDeleted: false },
        { id: 'msg-12', conversationId: 'conv-t3-announce', userId: 'user-6', text: 'Welcome to The Lighthouse Keeper. Official announcements will be posted here. Please keep this channel for official use. For general discussion, use the #general channel.', createdAt: new Date(new Date().getTime() - 11 * 24 * 60 * 60000 + 1000), isDeleted: false },
    ];

    const initialDonationRecords: DonationRecord[] = [
        { id: 'don-1', tenantId: 'tenant-1', userId: 'user-3', displayName: 'Jim Halpert', amount: 50, currency: 'USD', donatedAt: new Date('2024-07-20T10:00:00Z'), isAnonymousOnLeaderboard: false, message: 'For the youth group!' },
        { id: 'don-2', tenantId: 'tenant-1', userId: 'user-2', displayName: 'Dwight Schrute', amount: 100, currency: 'USD', donatedAt: new Date('2024-07-21T11:00:00Z'), isAnonymousOnLeaderboard: false },
        { id: 'don-3', tenantId: 'tenant-1', userId: 'user-4', displayName: 'Pam Beesly', amount: 25, currency: 'USD', donatedAt: new Date('2024-07-21T12:00:00Z'), isAnonymousOnLeaderboard: true, message: 'Happy to help.' },
        { id: 'don-4', tenantId: 'tenant-1', userId: null, displayName: 'A Friend', amount: 250, currency: 'USD', donatedAt: new Date('2024-06-15T09:00:00Z'), isAnonymousOnLeaderboard: false },
        { id: 'don-5', tenantId: 'tenant-1', userId: 'user-1', displayName: 'Michael Scott', amount: 75, currency: 'USD', donatedAt: new Date('2025-05-30T15:00:00Z'), isAnonymousOnLeaderboard: false },
    ];

    const initialVolunteerNeeds: VolunteerNeed[] = [
        {
          id: 'need-1',
          tenantId: 'tenant-3',
          eventId: 'evt-11', // Linked to Foghorn Maintenance Day
          title: 'Foghorn Maintenance Crew',
          description: 'Assist the Chandler with cleaning and servicing the foghorn. Requires some light lifting and tolerance for loud noises.',
          date: new Date('2025-11-15T10:00:00Z'),
          slotsNeeded: 4,
        },
        {
          id: 'need-2',
          tenantId: 'tenant-3',
          title: 'Sunday Greeters',
          description: 'Welcome congregants to the Sermon by the Sea. A friendly disposition is all that\'s required.',
          date: new Date('2025-11-16T09:00:00Z'),
          slotsNeeded: 2,
        },
    ];

    const initialVolunteerSignups: VolunteerSignup[] = [
        { id: 'signup-1', needId: 'need-1', userId: 'user-14', signedUpAt: new Date(), status: VolunteerStatus.CONFIRMED },
        { id: 'signup-2', needId: 'need-1', userId: 'user-15', signedUpAt: new Date(), status: VolunteerStatus.CONFIRMED },
        { id: 'signup-3', needId: 'need-2', userId: 'user-9', signedUpAt: new Date(), status: VolunteerStatus.CONFIRMED },
    ];

    const initialSmallGroups: SmallGroup[] = [
        { id: 'sg-1', tenantId: 'tenant-3', name: 'Maritime History Study', description: 'A weekly group dedicated to studying the histories and scriptures of those who lived by the sea.', leaderUserId: 'user-7', meetingSchedule: 'Wednesdays at 6 PM', isActive: true },
        { id: 'sg-2', tenantId: 'tenant-3', name: 'The Net Menders', description: 'A service-oriented group focused on practical help for our community, from fixing nets to mending sails.', leaderUserId: 'user-12', meetingSchedule: 'Saturdays at 10 AM', isActive: true },
        { id: 'sg-3', tenantId: 'tenant-3', name: 'The Night Watch', description: 'A contemplative group that meets for quiet reflection during the early hours of the morning.', leaderUserId: 'user-9', meetingSchedule: 'Fridays at 5 AM', isActive: false },
    ];

    const initialSmallGroupMemberships: SmallGroupMembership[] = [
        // Group 1
        { id: 'sgm-1', groupId: 'sg-1', userId: 'user-7', role: SmallGroupRole.LEADER, joinedAt: new Date() },
        { id: 'sgm-2', groupId: 'sg-1', userId: 'user-9', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-3', groupId: 'sg-1', userId: 'user-13', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-4', groupId: 'sg-1', userId: 'user-19', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        // Group 2
        { id: 'sgm-5', groupId: 'sg-2', userId: 'user-12', role: SmallGroupRole.LEADER, joinedAt: new Date() },
        { id: 'sgm-6', groupId: 'sg-2', userId: 'user-8', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-7', groupId: 'sg-2', userId: 'user-10', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-8', groupId: 'sg-2', userId: 'user-14', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-9', groupId: 'sg-2', userId: 'user-16', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
        { id: 'sgm-10', groupId: 'sg-2', userId: 'user-17', role: SmallGroupRole.MEMBER, joinedAt: new Date() },
    ];
    
    const initialCommunityPosts: CommunityPost[] = [
      { id: 'cp-1', tenantId: 'tenant-3', authorUserId: 'user-15', type: CommunityPostType.PRAYER_REQUEST, body: "Please pray for my mother, Pearl, as she undergoes surgery next week. Praying for the surgeon's hands and for a peaceful recovery.", isAnonymous: false, status: CommunityPostStatus.PUBLISHED, createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60000) },
      { id: 'cp-2', tenantId: 'tenant-3', authorUserId: null, type: CommunityPostType.PRAYER_REQUEST, body: "For guidance and clarity as I navigate a difficult decision at work. I feel lost at sea.", isAnonymous: true, status: CommunityPostStatus.PUBLISHED, createdAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60000) },
      { id: 'cp-3', tenantId: 'tenant-3', authorUserId: 'user-18', type: CommunityPostType.TANGIBLE_NEED, body: "My fishing nets were badly damaged in the last storm. If anyone has experience with mending or has spare netting, any help would be a blessing.", isAnonymous: false, status: CommunityPostStatus.PENDING_APPROVAL, createdAt: new Date(new Date().getTime() - 12 * 60 * 60000) },
    ];
    
    const initialResourceItems: ResourceItem[] = [
      { id: 'res-1', tenantId: 'tenant-3', uploaderUserId: 'user-6', title: 'Weekly Sermon Notes - Nov 2nd', description: 'Notes and scripture references from the "Guiding Light" sermon.', fileUrl: '#', fileType: FileType.PDF, visibility: ResourceVisibility.MEMBERS_ONLY, createdAt: new Date('2025-11-02T12:00:00Z') },
      { id: 'res-2', tenantId: 'tenant-3', uploaderUserId: 'user-7', title: 'Chart of Local Tides', description: 'A helpful chart for all our seafaring members.', fileUrl: '#', fileType: FileType.JPG, visibility: ResourceVisibility.PUBLIC, createdAt: new Date('2025-11-01T15:00:00Z') },
      { id: 'res-3', tenantId: 'tenant-3', uploaderUserId: 'user-8', title: 'Foghorn Maintenance Checklist', description: 'The official checklist for servicing the foghorn apparatus.', fileUrl: '#', fileType: FileType.DOCX, visibility: ResourceVisibility.MEMBERS_ONLY, createdAt: new Date('2025-10-29T10:00:00Z') },
    ];

    return {
        users: initialUsers,
        tenants: initialTenants,
        memberships: initialMemberships,
        posts: initialPosts,
        events: initialEvents,
        mediaItems: initialMediaItems,
        conversations: initialConversations,
        conversationParticipants: initialParticipants,
        chatMessages: initialChatMessages,
        auditLogs: [],
        notifications: [],
        donationRecords: initialDonationRecords,
        volunteerNeeds: initialVolunteerNeeds,
        volunteerSignups: initialVolunteerSignups,
        smallGroups: initialSmallGroups,
        smallGroupMemberships: initialSmallGroupMemberships,
        communityPosts: initialCommunityPosts,
        resourceItems: initialResourceItems,
        contactSubmissions: [],
    };
};

let store = loadState();

/**
 * A helper function to update the in-memory store and persist it to localStorage.
 * This simulates a database write transaction.
 * @param updates A partial AppData object containing the slices of state to update.
 */
const updateStore = (updates: Partial<AppData>) => {
  store = { ...store, ...updates };
  saveState(store);
};

// --- GLOBAL GETTERS ---
/**
 * Corresponds to `tenantService.getTenants()`.
 * Simulates: `GET /api/tenants`
 * @returns An array of all tenants in the system.
 */
export const getTenants = () => store.tenants;

/**
 * Raw accessor for user data, primarily used for authentication checks.
 */
export const users = store.users; // Used for mock login, can remain as is.

/**
 * Raw accessor for the super admin user.
 */
export const superAdmin = store.users.find(u => u.isSuperAdmin)!;

// --- READ-ONLY FUNCTIONS (now read from `store`) ---

/**
 * Corresponds to `userService.getUserById()`.
 * Simulates: `GET /api/users/:userId`
 * @param userId The ID of the user to retrieve.
 * @returns The user object or undefined if not found.
 */
export function getUserById(userId: string): User | undefined {
    return store.users.find(u => u.id === userId);
}

/**
 * Corresponds to `userService.getAllUsers()`.
 * Simulates: `GET /api/users`
 * @returns An array of all users.
 */
export function getAllUsers(): User[] {
    return store.users;
}

/**
 * Corresponds to `tenantService.getTenantById()`.
 * Simulates: `GET /api/tenants/:tenantId`
 * @param tenantId The ID of the tenant to retrieve.
 * @returns The tenant object or undefined if not found.
 */
export function getTenantById(tenantId: string): Tenant | undefined {
    return store.tenants.find(t => t.id === tenantId);
}

/**
 * Retrieves all tenants a specific user is a member of.
 * @param userId The ID of the user.
 * @returns An array of tenants.
 */
export function getTenantsForUser(userId: string): Tenant[] {
    const userMemberships = store.memberships.filter(m => m.userId === userId && m.status === MembershipStatus.APPROVED);
    return store.tenants.filter(tenant => userMemberships.some(m => m.tenantId === tenant.id));
}

/**
 * Corresponds to `tenantService.getMembers()`.
 * Simulates: `GET /api/tenants/:tenantId/memberships`
 * @param tenantId The ID of the tenant.
 * @returns An array of enriched member objects, including their user profile and membership details.
 */
export function getMembersForTenant(tenantId: string): EnrichedMember[] {
    const tenantMemberships = store.memberships.filter(m => m.tenantId === tenantId);
    return tenantMemberships.map(membership => {
        const user = store.users.find(u => u.id === membership.userId);
        if (!user) return null;
        return {
            ...user,
            membership,
        };
    }).filter((m): m is EnrichedMember => m !== null)
      .sort((a,b) => {
        const roleOrder = { [TenantRole.ADMIN]: 0, [TenantRole.STAFF]: 1, [TenantRole.CLERGY]: 1, [TenantRole.MODERATOR]: 2, [TenantRole.MEMBER]: 3 };
        const aRole = a.membership.roles.find(r => r.isPrimary)?.role || TenantRole.MEMBER;
        const bRole = b.membership.roles.find(r => r.isPrimary)?.role || TenantRole.MEMBER;
        if (roleOrder[aRole] < roleOrder[bRole]) return -1;
        if (roleOrder[aRole] > roleOrder[bRole]) return 1;
        return a.profile.displayName.localeCompare(b.profile.displayName);
      });
}

/**
 * Retrieves the roles for a user within a specific tenant.
 * @param userId The user's ID.
 * @param tenantId The tenant's ID.
 * @returns An array of `TenantRole` enums.
 */
export function getRolesForUserInTenant(userId: string, tenantId: string): TenantRole[] {
    const membership = store.memberships.find(m => m.userId === userId && m.tenantId === tenantId && m.status === MembershipStatus.APPROVED);
    return membership ? membership.roles.map(r => r.role) : [];
}

/**
 * Retrieves the full membership record for a user in a tenant.
 * @param userId The user's ID.
 * @param tenantId The tenant's ID.
 * @returns The `UserTenantMembership` object or undefined.
 */
export function getMembershipForUserInTenant(userId: string, tenantId: string): UserTenantMembership | undefined {
    return store.memberships.find(m => m.userId === userId && m.tenantId === tenantId);
}

// --- MUTATOR FUNCTIONS (now read from `store`, then call `updateStore`) ---

/**
 * Simulates the notification service creating a new notification.
 * @param notification The notification data to create.
 */
function generateNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        isRead: false,
        createdAt: new Date(),
    };
    updateStore({ notifications: [newNotification, ...store.notifications] });
}

/**
 * Simulates the audit service logging an event.
 * @param event The audit log data.
 */
export function logAuditEvent(event: Omit<AuditLog, 'id' | 'createdAt'>): void {
  const newLog: AuditLog = {
    ...event,
    id: `log-${Date.now()}`,
    createdAt: new Date(),
  };
  updateStore({ auditLogs: [newLog, ...store.auditLogs] });
  console.log('Audit Event Logged:', newLog);
}

/**
 * Corresponds to `authService.register()`.
 * Simulates: `POST /api/auth/register`
 * @param displayName The user's chosen display name.
 * @param email The user's email address.
 * @param pass The user's password.
 * @returns An object indicating success or failure.
 */
export function registerUser(displayName: string, email: string, pass: string): { success: boolean; message?: string; user?: User } {
  if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    password: pass,
    isSuperAdmin: false,
    profile: {
      displayName,
      avatarUrl: `https://i.pravatar.cc/48?u=user-${Date.now()}`,
      bio: '',
      locationCity: '',
      locationCountry: '',
      languages: [],
    },
    privacySettings: {
      showAffiliations: true,
    },
    accountSettings: defaultAccountSettings,
    notificationPreferences: defaultNotificationPreferences,
  };

  updateStore({ users: [...store.users, newUser] });
  logAuditEvent({
    actorUserId: newUser.id,
    actionType: ActionType.USER_REGISTERED,
    entityType: 'USER',
    entityId: newUser.id,
  });

  return { success: true, user: newUser };
}

/**
 * Corresponds to `authService.requestPasswordReset()`.
 * Simulates: `POST /api/auth/forgot-password`
 * @param email The user's email.
 * @returns A boolean indicating if a user with that email was found.
 */
export function requestPasswordReset(email: string): boolean {
  const userExists = store.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    console.log(`Password reset requested for ${email}. In a real app, an email would be sent.`);
  } else {
    console.log(`Password reset requested for non-existent email: ${email}. No action taken.`);
  }
  return userExists;
}

/**
 * Corresponds to `authService.resetPassword()`.
 * Simulates: `POST /api/auth/reset-password`
 * @param email The user's email.
 * @param newPassword The new password.
 * @returns An object indicating success or failure.
 */
export function resetPassword(email: string, newPassword: string): { success: boolean, message?: string } {
  const userIndex = store.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  const updatedUsers = store.users.map((user, index) => 
    index === userIndex ? { ...user, password: newPassword } : user
  );
  updateStore({ users: updatedUsers });
  console.log(`Password reset for ${email}.`);
  return { success: true };
}

/**
 * Corresponds to `userService.updateProfile()`.
 * Simulates: `PUT /api/users/me/profile`
 * @param userId The ID of the user to update.
 * @param profileData A partial `UserProfile` object with new data.
 * @returns A boolean indicating success.
 */
export function updateUserProfile(userId: string, profileData: Partial<UserProfile>): boolean {
  const userIndex = store.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  const updatedUsers = [...store.users];
  updatedUsers[userIndex].profile = { ...updatedUsers[userIndex].profile, ...profileData };
  updateStore({ users: updatedUsers });
  
  logAuditEvent({
    actorUserId: userId,
    actionType: ActionType.USER_PROFILE_UPDATED,
    entityType: 'USER',
    entityId: userId,
  });

  return true;
}

/**
 * Corresponds to `adminService.updateUserProfile()`.
 * Simulates an admin-only API endpoint for updating any user's profile.
 * @param adminUserId The ID of the admin performing the action.
 * @param targetUserId The ID of the user being updated.
 * @param profileData A partial `UserProfile` object with new data.
 * @returns A boolean indicating success.
 */
export function adminUpdateUserProfile(adminUserId: string, targetUserId: string, profileData: Partial<UserProfile>): boolean {
  const userIndex = store.users.findIndex(u => u.id === targetUserId);
  if (userIndex === -1) return false;

  const updatedUsers = [...store.users];
  updatedUsers[userIndex].profile = { ...updatedUsers[userIndex].profile, ...profileData };
  updateStore({ users: updatedUsers });

  logAuditEvent({
    actorUserId: adminUserId,
    effectiveUserId: targetUserId,
    actionType: ActionType.ADMIN_UPDATED_USER_PROFILE,
    entityType: 'USER',
    entityId: targetUserId,
  });

  return true;
}

/**
 * Corresponds to `userService.updatePrivacySettings()`.
 * Simulates: `PUT /api/users/me/privacy`
 * @param userId The ID of the user to update.
 * @param privacyData A partial `UserPrivacySettings` object.
 * @returns A boolean indicating success.
 */
export function updateUserPrivacySettings(userId: string, privacyData: Partial<UserPrivacySettings>): boolean {
  const userIndex = store.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  const updatedUsers = [...store.users];
  updatedUsers[userIndex].privacySettings = { ...updatedUsers[userIndex].privacySettings, ...privacyData };
  updateStore({ users: updatedUsers });
  
  return true;
}

/**
 * Corresponds to `userService.updateAccountSettings()`.
 * Simulates: `PUT /api/users/me/account-settings`
 * @param userId The ID of the user to update.
 * @param settings A full `AccountSettings` object.
 * @returns A boolean indicating success.
 */
export function updateUserAccountSettings(userId: string, settings: AccountSettings): boolean {
  const userIndex = store.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  const updatedUsers = [...store.users];
  updatedUsers[userIndex].accountSettings = settings;
  updateStore({ users: updatedUsers });
  
  console.log(`Account settings updated for user ${userId}`);

  return true;
}

/**
 * Corresponds to `userService.updateNotificationPreferences()`.
 * Simulates an endpoint for updating user notification preferences.
 * @param userId The ID of the user to update.
 * @param preferences A full `NotificationPreferences` object.
 * @returns A boolean indicating success.
 */
export function updateUserNotificationPreferences(userId: string, preferences: NotificationPreferences): boolean {
  const userIndex = store.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  const updatedUsers = [...store.users];
  updatedUsers[userIndex].notificationPreferences = preferences;
  updateStore({ users: updatedUsers });
  
  console.log(`Notification preferences updated for user ${userId}`);

  return true;
}

/**
 * Corresponds to `membershipService.joinOrRequestToJoin()`.
 * Simulates: `POST /api/tenants/:tenantId/memberships/join` or `/request`
 * @param userId The ID of the user joining.
 * @param tenantId The ID of the tenant to join.
 * @returns The new membership record or null if the tenant doesn't exist.
 */
export function requestToJoinTenant(userId: string, tenantId: string): UserTenantMembership | null {
  if (getMembershipForUserInTenant(userId, tenantId)) {
    console.warn("User already has a membership record for this tenant.");
    return getMembershipForUserInTenant(userId, tenantId)!;
  }
  const tenant = getTenantById(tenantId);
  if (!tenant) return null;

  const status = tenant.settings.membershipApprovalMode === MembershipApprovalMode.OPEN 
    ? MembershipStatus.APPROVED 
    : MembershipStatus.REQUESTED;

  const newMembership: UserTenantMembership = {
    id: `m-${Date.now()}`, userId, tenantId, status,
    roles: [{ id: `tr-${Date.now()}`, role: TenantRole.MEMBER, isPrimary: true, displayTitle: '' }],
  };

  updateStore({ memberships: [...store.memberships, newMembership] });
  logAuditEvent({
    actorUserId: userId,
    actionType: ActionType.USER_JOINED_TENANT,
    entityType: 'TENANT',
    entityId: tenantId,
    metadata: { status }
  });

  return newMembership;
}

/**
 * Corresponds to `membershipService.updateStatus()`.
 * Simulates: `POST /api/tenants/:tenantId/memberships/:membershipId/approve` (or reject, ban, etc.)
 * @param membershipId The ID of the membership record to update.
 * @param newStatus The new status to apply.
 * @param adminUserId The ID of the admin performing the action.
 * @returns A boolean indicating success.
 */
export function updateMembershipStatus(membershipId: string, newStatus: MembershipStatus, adminUserId: string): boolean {
    const membershipIndex = store.memberships.findIndex(m => m.id === membershipId);
    if (membershipIndex === -1) return false;

    const oldStatus = store.memberships[membershipIndex].status;
    
    const updatedMemberships = store.memberships.map((m, index) => {
        if (index === membershipIndex) {
            return { ...m, status: newStatus };
        }
        return m;
    });

    const membership = updatedMemberships[membershipIndex];
    updateStore({ memberships: updatedMemberships });

    let actionType = ActionType.MEMBERSHIP_STATUS_UPDATED;
    if (newStatus === MembershipStatus.BANNED) actionType = ActionType.BAN_USER;
    else if (oldStatus === MembershipStatus.BANNED && newStatus === MembershipStatus.APPROVED) actionType = ActionType.UNBAN_USER;
    
    // Generate notification on approval
    if (oldStatus === MembershipStatus.REQUESTED && newStatus === MembershipStatus.APPROVED) {
        const tenant = getTenantById(membership.tenantId);
        if (tenant) {
            generateNotification({
                userId: membership.userId,
                actorUserId: adminUserId,
                type: 'MEMBERSHIP_APPROVED',
                message: `Your request to join ${tenant.name} has been approved.`,
                link: `tenant/${tenant.id}`
            });
        }
    }

    logAuditEvent({
        actorUserId: adminUserId,
        actionType: actionType,
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        metadata: { 
            userId: membership.userId,
            tenantId: membership.tenantId,
            oldStatus, newStatus 
        }
    });
    return true;
}

/**
 * Corresponds to `membershipService.updateRoles()`.
 * Simulates: `POST /api/tenants/:tenantId/memberships/:membershipId/role`
 * @param membershipId The ID of the membership record.
 * @param newRoles The new array of role objects.
 * @param adminUserId The ID of the admin performing the action.
 * @returns A boolean indicating success.
 */
export function updateMemberRolesAndTitle(membershipId: string, newRoles: UserTenantRole[], adminUserId: string): boolean {
    const membershipIndex = store.memberships.findIndex(m => m.id === membershipId);
    if (membershipIndex === -1) return false;

    const primaryRolesCount = newRoles.filter(r => r.isPrimary).length;
    let finalizedRoles = newRoles;

    if (newRoles.length > 0 && primaryRolesCount !== 1) {
        let primarySet = false;
        finalizedRoles = newRoles.map(role => {
            const isPrimary = !primarySet;
            if (isPrimary) {
                primarySet = true;
            }
            // Create a new object to avoid mutation
            return { ...role, isPrimary };
        });
    }

    const updatedMemberships = store.memberships.map((m, index) => {
        if (index === membershipIndex) {
            // Create a new object to avoid mutation
            return { ...m, roles: finalizedRoles };
        }
        return m;
    });
    updateStore({ memberships: updatedMemberships });

    logAuditEvent({
        actorUserId: adminUserId,
        actionType: ActionType.MEMBER_ROLES_UPDATED,
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        metadata: { 
            userId: store.memberships[membershipIndex].userId,
            tenantId: store.memberships[membershipIndex].tenantId,
            newRoles: finalizedRoles.map(r => ({ role: r.role, title: r.displayTitle }))
        }
    });
    return true;
}

/**
 * Corresponds to a user-specific service method for updating their tenant-specific profile.
 * @param userId The ID of the user performing the update.
 * @param membershipId The ID of the membership record.
 * @param profile The new profile data (displayName, displayTitle).
 * @returns A boolean indicating success.
 */
export function updateMembershipProfile(userId: string, membershipId: string, profile: { displayName: string, displayTitle: string }): boolean {
    const membershipIndex = store.memberships.findIndex(m => m.id === membershipId && m.userId === userId);
    if (membershipIndex === -1) return false;
    
    const updatedMemberships = [...store.memberships];
    const membership = { ...updatedMemberships[membershipIndex] };
    membership.displayName = profile.displayName.trim() || undefined;

    const primaryRoleIndex = membership.roles.findIndex(r => r.isPrimary);
    if (primaryRoleIndex !== -1) {
        membership.roles[primaryRoleIndex].displayTitle = profile.displayTitle;
    } else if (membership.roles.length > 0) {
        membership.roles[0].displayTitle = profile.displayTitle;
    }
    updatedMemberships[membershipIndex] = membership;
    updateStore({ memberships: updatedMemberships });

    logAuditEvent({
        actorUserId: userId,
        actionType: ActionType.MEMBERSHIP_PROFILE_UPDATED,
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        metadata: { tenantId: membership.tenantId, ...profile }
    });
    return true;
}

/**
 * Retrieves a user's memberships, enriched with tenant data.
 * @param userId The ID of the user.
 * @returns An array of enriched membership objects.
 */
export function getEnrichedMembershipsForUser(userId: string): Array<{ membership: UserTenantMembership, tenant: Tenant }> {
    return store.memberships
        .filter(m => m.userId === userId && m.status === MembershipStatus.APPROVED)
        .map(membership => {
            const tenant = store.tenants.find(t => t.id === membership.tenantId);
            if (!tenant) return null;
            return { membership, tenant };
        })
        .filter((item): item is { membership: UserTenantMembership, tenant: Tenant } => item !== null);
}

/**
 * Corresponds to `tenantService.createTenant()`.
 * Simulates: `POST /api/tenants`
 * @param tenantDetails The initial details for the new tenant.
 * @returns The newly created tenant object.
 */
export function createTenant(tenantDetails: Omit<Tenant, 'id' | 'slug' | 'settings' | 'branding' | 'permissions'>): Tenant {
    const newTenant: Tenant = {
      ...getInitialTenant(),
      ...tenantDetails,
      id: `tenant-${Date.now()}`,
      slug: tenantDetails.name.toLowerCase().replace(/\s+/g, '-'),
    };
    updateStore({ tenants: [...store.tenants, newTenant] });
    return newTenant;
}

/**
 * Corresponds to `tenantService.updateTenant()`.
 * Simulates: `PUT /api/tenants/:tenantId/settings/...`
 * @param updatedTenant The complete tenant object with updated fields.
 */
export function updateTenant(updatedTenant: Tenant): void {
    const updatedTenants = store.tenants.map(t => (t.id === updatedTenant.id ? updatedTenant : t));
    updateStore({ tenants: updatedTenants });
}

/**
 * Corresponds to `tenantService.updatePermissions()`.
 * Simulates an admin endpoint for updating role permissions.
 * @param tenantId The ID of the tenant to update.
 * @param newPermissions The new permissions matrix.
 * @param adminUserId The ID of the admin performing the action.
 * @returns A boolean indicating success.
 */
export function updateTenantPermissions(tenantId: string, newPermissions: TenantFeaturePermissions, adminUserId: string): boolean {
  const tenantIndex = store.tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) return false;
  
  const updatedTenants = [...store.tenants];
  updatedTenants[tenantIndex].permissions = newPermissions;
  updateStore({ tenants: updatedTenants });

  logAuditEvent({
    actorUserId: adminUserId,
    actionType: ActionType.TENANT_PERMISSIONS_UPDATED,
    entityType: 'TENANT',
    entityId: tenantId,
  });
  return true;
}

/**
 * Corresponds to `contentService.getPosts()`.
 * Simulates: `GET /api/tenants/:tenantId/posts?type=BLOG`
 * @param tenantId The ID of the tenant.
 * @returns An array of posts enriched with author details.
 */
export function getPostsForTenant(tenantId: string): PostWithAuthor[] {
    return store.posts
        .filter(p => p.tenantId === tenantId && p.type !== 'BOOK')
        .map(post => {
            const author = getUserById(post.authorUserId);
            const authorMembership = getMembershipForUserInTenant(post.authorUserId, tenantId);
            return {
                ...post,
                authorDisplayName: authorMembership?.displayName || author?.profile.displayName || 'Unknown Author',
                authorAvatarUrl: author?.profile.avatarUrl,
            }
        })
        .sort((a,b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Corresponds to `contentService.getPosts()`.
 * Simulates: `GET /api/tenants/:tenantId/posts?type=BOOK`
 * @param tenantId The ID of the tenant.
 * @returns An array of book-type posts enriched with author details.
 */
export function getBooksForTenant(tenantId: string): PostWithAuthor[] {
    return store.posts
        .filter(p => p.tenantId === tenantId && p.type === 'BOOK')
        .map(post => {
            const author = getUserById(post.authorUserId);
            const authorMembership = getMembershipForUserInTenant(post.authorUserId, tenantId);
            return {
                ...post,
                authorDisplayName: authorMembership?.displayName || author?.profile.displayName || 'Unknown Author',
                authorAvatarUrl: author?.profile.avatarUrl,
            }
        })
        .sort((a,b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

/**
 * Corresponds to `contentService.createPost()`.
 * Simulates: `POST /api/tenants/:tenantId/posts`
 * @param postData The data for the new post.
 * @returns The created post object.
 */
export function addPost(postData: Omit<Post, 'id' | 'publishedAt'>): Post {
  const newPost: Post = {
    ...postData,
    id: `post-${Date.now()}`,
    publishedAt: new Date(),
  };
  updateStore({ posts: [newPost, ...store.posts] });

  // Generate notifications for announcements
  if (newPost.type === 'ANNOUNCEMENT') {
    const members = getMembersForTenant(newPost.tenantId);
    const tenant = getTenantById(newPost.tenantId);
    const author = getUserById(newPost.authorUserId);
    members.forEach(member => {
        if (member.id !== newPost.authorUserId) { // Don't notify the author
            generateNotification({
                userId: member.id,
                actorUserId: newPost.authorUserId,
                type: 'NEW_ANNOUNCEMENT',
                message: `${author?.profile.displayName} posted a new announcement in ${tenant?.name}: "${newPost.title}"`,
                link: `tenant/${newPost.tenantId}`,
            });
        }
    });
  }

  return newPost;
}

/**
 * Corresponds to `eventService.getEvents()`.
 * Simulates: `GET /api/tenants/:tenantId/events`
 * @param tenantId The ID of the tenant.
 * @returns An array of events enriched with creator details.
 */
export function getEventsForTenant(tenantId: string): EventWithCreator[] {
    return store.events
        .filter(e => e.tenantId === tenantId)
        .map(event => {
            const creator = getUserById(event.createdByUserId);
            const creatorMembership = getMembershipForUserInTenant(event.createdByUserId, tenantId);
            return {
                ...event,
                creatorDisplayName: creatorMembership?.displayName || creator?.profile.displayName || 'Unknown Creator',
                creatorAvatarUrl: creator?.profile.avatarUrl,
            };
        })
        .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
}

/**
 * Corresponds to `eventService.createEvent()`.
 * Simulates: `POST /api/tenants/:tenantId/events`
 * @param newEventData The data for the new event.
 * @returns The created event object.
 */
export function addEvent(newEventData: Omit<Event, 'id'>): Event {
    const newEvent: Event = {
        ...newEventData,
        id: `evt-${Date.now()}`,
    };
    updateStore({ events: [...store.events, newEvent] });
    return newEvent;
}

/**
 * Corresponds to `mediaService.getMediaItems()`.
 * Simulates: `GET /api/tenants/:tenantId/media?type=SERMON_VIDEO`
 * @param tenantId The ID of the tenant.
 * @returns An array of sermon videos enriched with author details.
 */
export function getSermonsForTenant(tenantId: string): EnrichedMediaItem[] {
    return store.mediaItems
        .filter(item => item.tenantId === tenantId && item.type === 'SERMON_VIDEO')
        .map(item => {
            const author = getUserById(item.authorUserId);
            const authorMembership = getMembershipForUserInTenant(item.authorUserId, tenantId);
            return {
                ...item,
                authorDisplayName: authorMembership?.displayName || author?.profile.displayName || 'Unknown Author',
                authorAvatarUrl: author?.profile.avatarUrl,
            }
        })
        .sort((a,b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Corresponds to `mediaService.getMediaItems()`.
 * Simulates: `GET /api/tenants/:tenantId/media?type=PODCAST_AUDIO`
 * @param tenantId The ID of the tenant.
 * @returns An array of podcasts enriched with author details.
 */
export function getPodcastsForTenant(tenantId: string): EnrichedMediaItem[] {
    return store.mediaItems
        .filter(item => item.tenantId === tenantId && item.type === 'PODCAST_AUDIO')
        .map(item => {
            const author = getUserById(item.authorUserId);
            const authorMembership = getMembershipForUserInTenant(item.authorUserId, tenantId);
            return {
                ...item,
                authorDisplayName: authorMembership?.displayName || author?.profile.displayName || 'Unknown Author',
                authorAvatarUrl: author?.profile.avatarUrl,
            }
        })
        .sort((a,b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Corresponds to `messagingService.getMessages()`.
 * Simulates: `GET /api/conversations/:id/messages`
 * @param conversationId The ID of the conversation.
 * @param tenantId Optional tenant context for resolving display names.
 * @returns An array of messages enriched with user details.
 */
export function getMessagesForConversation(conversationId: string, tenantId?: string): EnrichedChatMessage[] {
    return store.chatMessages
        .filter(msg => msg.conversationId === conversationId && !msg.isDeleted)
        .map(msg => {
            const user = getUserById(msg.userId);
            let userDisplayName = user?.profile.displayName || 'Unknown User';
            if (user && tenantId) {
                const membership = getMembershipForUserInTenant(user.id, tenantId);
                userDisplayName = membership?.displayName || user.profile.displayName;
            }
            return {
                ...msg,
                userDisplayName,
                userAvatarUrl: user?.profile.avatarUrl,
            };
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Corresponds to `messagingService.sendMessage()`.
 * Simulates: `POST /api/conversations/:id/messages`
 * @param conversationId The ID of the conversation.
 * @param userId The ID of the user sending the message.
 * @param text The message content.
 * @returns The newly created, enriched message object.
 */
export function addMessage(conversationId: string, userId: string, text: string): EnrichedChatMessage {
    const user = getUserById(userId);
    const conversation = store.conversations.find(c => c.id === conversationId);
    
    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId,
        userId,
        text,
        createdAt: new Date(),
        isDeleted: false,
    };
    updateStore({ chatMessages: [...store.chatMessages, newMessage] });

    // Generate notification for direct messages
    if (conversation?.isDirect) {
        const participant = store.conversationParticipants.find(p => p.conversationId === conversationId && p.userId !== userId);
        if (participant) {
            generateNotification({
                userId: participant.userId,
                actorUserId: userId,
                type: 'NEW_DIRECT_MESSAGE',
                message: `You have a new message from ${user?.profile.displayName}.`,
                link: 'messages',
            });
        }
    }

    return {
        ...newMessage,
        userDisplayName: user?.profile.displayName || 'Unknown User',
        userAvatarUrl: user?.profile.avatarUrl,
    };
}

/**
 * Corresponds to `messagingService.deleteMessage()`.
 * Simulates: `DELETE /api/messages/:id`
 * @param messageId The ID of the message to delete.
 * @param requesterId The ID of the user requesting the deletion.
 * @returns A boolean indicating success.
 */
export function deleteMessage(messageId: string, requesterId: string): boolean {
    const messageIndex = store.chatMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    const message = store.chatMessages[messageIndex];
    const requester = getUserById(requesterId);
    if (!requester) return false;

    const conversation = store.conversations.find(c => c.id === message.conversationId);
    if (!conversation) return false;

    const tenant = conversation.tenantId ? getTenantById(conversation.tenantId) : undefined;
    
    if (!canDeleteMessage(requester, { ...message, userDisplayName: '' }, conversation, tenant)) {
        return false;
    }

    const updatedMessages = [...store.chatMessages];
    updatedMessages[messageIndex].isDeleted = true;
    updateStore({ chatMessages: updatedMessages });
    
    logAuditEvent({
        actorUserId: requester.id,
        actionType: ActionType.DELETE_MESSAGE,
        entityType: 'MESSAGE',
        entityId: messageId,
        metadata: { conversationId: conversation.id, tenantId: conversation.tenantId }
    });
    return true;
}

/**
 * Corresponds to `messagingService.markAsRead()`.
 * Updates the user's `lastReadMessageId` for a conversation.
 * @param userId The ID of the user.
 * @param conversationId The ID of the conversation.
 */
export function markConversationAsRead(userId: string, conversationId:string) {
    const allMessages = getMessagesForConversation(conversationId);
    if (allMessages.length === 0) return;
    
    const lastMessageId = allMessages[allMessages.length - 1].id;
    
    const participantIndex = store.conversationParticipants.findIndex(p => p.userId === userId && p.conversationId === conversationId);
    if (participantIndex > -1) {
        const updatedParticipants = [...store.conversationParticipants];
        updatedParticipants[participantIndex].lastReadMessageId = lastMessageId;
        updateStore({ conversationParticipants: updatedParticipants });
    }
}

/**
 * Corresponds to `messagingService.getConversations()`.
 * Simulates: `GET /api/messages/conversations`
 * @param currentUserId The ID of the user requesting their conversations.
 * @returns An array of the user's conversations, enriched with participants, last message, and unread count.
 */
export function getConversationsForUser(currentUserId: string): EnrichedConversation[] {
    const currentUser = getUserById(currentUserId);
    if (!currentUser) return [];

    const userConvIds = store.conversationParticipants
        .filter(p => p.userId === currentUserId)
        .map(p => p.conversationId);

    return store.conversations
        .filter(c => currentUser.isSuperAdmin || userConvIds.includes(c.id))
        .map(conv => {
            const participants = store.conversationParticipants
                .filter(p => p.conversationId === conv.id)
                .map(p => getUserById(p.userId))
                .filter((u): u is User => u !== undefined);

            const allMessages = getMessagesForConversation(conv.id, conv.tenantId || undefined);
            const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : undefined;
            
            let displayName = conv.name || 'Conversation';
            if (conv.isDirect) {
                const otherUser = participants.find(p => p.id !== currentUserId);
                displayName = otherUser ? otherUser.profile.displayName : 'Direct Message';
            }

            const participantRecord = store.conversationParticipants.find(p => p.userId === currentUserId && p.conversationId === conv.id);
            let unreadCount = 0;
            if (participantRecord && allMessages.length > 0) {
                if (!participantRecord.lastReadMessageId) unreadCount = allMessages.length;
                else {
                    const lastReadIndex = allMessages.findIndex(m => m.id === participantRecord.lastReadMessageId);
                    unreadCount = lastReadIndex > -1 ? allMessages.length - 1 - lastReadIndex : allMessages.length;
                }
            } else if (!participantRecord && allMessages.length > 0) {
                 unreadCount = allMessages.length;
            }

            return { ...conv, participants, unreadCount, lastMessage, displayName };
        })
        .sort((a, b) => {
            const timeA = a.lastMessage?.createdAt.getTime() || a.createdAt.getTime();
            const timeB = b.lastMessage?.createdAt.getTime() || b.createdAt.getTime();
            return timeB - timeA;
        });
}

/**
 * Corresponds to `messagingService.startDirectMessage()`.
 * Simulates: `POST /api/messages/dm/start`
 * @param userId1 The first user.
 * @param userId2 The second user.
 * @returns The existing or newly created direct message conversation.
 */
export function getOrCreateDirectConversation(userId1: string, userId2: string): Conversation {
    const user1ConvIds = new Set(store.conversationParticipants.filter(p => p.userId === userId1).map(p => p.conversationId));
    const user2ConvIds = new Set(store.conversationParticipants.filter(p => p.userId === userId2).map(p => p.conversationId));
    const commonConvIds = [...user1ConvIds].filter(id => user2ConvIds.has(id));

    const existingConversation = store.conversations.find(c =>
        c.isDirect && commonConvIds.includes(c.id) &&
        store.conversationParticipants.filter(p => p.conversationId === c.id).length === 2
    );
    if (existingConversation) return existingConversation;

    const newConversation: Conversation = {
        id: `conv-dm-${Date.now()}`, isDirect: true, tenantId: null, isPrivateGroup: false,
        createdByUserId: userId1, isDefaultChannel: false, createdAt: new Date(), updatedAt: new Date(),
    };
    const newParticipants: ConversationParticipant[] = [
        { id: `cp-${Date.now()}-1`, conversationId: newConversation.id, userId: userId1, lastReadMessageId: null },
        { id: `cp-${Date.now()}-2`, conversationId: newConversation.id, userId: userId2, lastReadMessageId: null }
    ];
    updateStore({
        conversations: [newConversation, ...store.conversations],
        conversationParticipants: [...store.conversationParticipants, ...newParticipants]
    });
    return newConversation;
}

/**
 * Corresponds to `messagingService.createChannel()`.
 * Simulates: `POST /api/tenants/:tenantId/conversations`
 * @param tenantId The tenant for the channel.
 * @param creatorUserId The user creating the channel.
 * @param name The channel name.
 * @param isPrivate Whether the channel is private.
 * @param participantUserIds The list of participants if private.
 * @returns The newly created conversation object.
 */
export function createConversation(tenantId: string, creatorUserId: string, name: string, isPrivate: boolean, participantUserIds: string[]): Conversation {
    const newConversation: Conversation = {
        id: `conv-${Date.now()}`, isDirect: false, tenantId, isPrivateGroup: isPrivate,
        name: name.startsWith('#') ? name : `#${name}`, createdByUserId: creatorUserId,
        isDefaultChannel: false, createdAt: new Date(), updatedAt: new Date(),
    };
    
    const baseParticipants = isPrivate ? participantUserIds : getMembersForTenant(tenantId).map(m => m.id);
    const finalParticipantIds = new Set(baseParticipants);
    finalParticipantIds.add(creatorUserId);

    const newParticipants: ConversationParticipant[] = Array.from(finalParticipantIds).map(userId => ({
        id: `cp-${newConversation.id}-${userId}`,
        conversationId: newConversation.id,
        userId,
        lastReadMessageId: null,
    }));
    
    updateStore({
        conversations: [...store.conversations, newConversation],
        conversationParticipants: [...store.conversationParticipants, ...newParticipants]
    });
    return newConversation;
}

/**
 * Corresponds to `adminService.getAuditLogs()`.
 * Simulates: `GET /api/admin/audit-logs`
 * @returns All audit logs.
 */
export function getAuditLogs(): AuditLog[] {
  return store.auditLogs;
}

// --- NOTIFICATION FUNCTIONS ---

/**
 * Corresponds to `notificationService.getNotifications()`.
 * Simulates: `GET /api/notifications`
 * @param userId The ID of the user.
 * @returns An array of notifications for the user.
 */
export function getNotificationsForUser(userId: string): Notification[] {
    return store.notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Corresponds to `notificationService.markAsRead()`.
 * Simulates: `POST /api/notifications/:id/read`
 * @param notificationId The ID of the notification to mark as read.
 */
export function markNotificationAsRead(notificationId: string): void {
    const updatedNotifications = store.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
    );
    updateStore({ notifications: updatedNotifications });
}

/**
 * Corresponds to `notificationService.markAllAsRead()`.
 * Simulates: `POST /api/notifications/read-all`
 * @param userId The ID of the user.
 */
export function markAllNotificationsAsRead(userId: string): void {
    const updatedNotifications = store.notifications.map(n => 
        n.userId === userId ? { ...n, isRead: true } : n
    );
    updateStore({ notifications: updatedNotifications });
}


// --- DONATION FUNCTIONS ---

/**
 * Corresponds to `donationService.getDonations()`.
 * Simulates: `GET /api/tenants/:tenantId/donations`
 * @param tenantId The ID of the tenant.
 * @param timeframe The time window for the donation records.
 * @returns An array of enriched donation records.
 */
export function getDonationsForTenant(tenantId: string, timeframe: 'ALL_TIME' | 'YEARLY' | 'MONTHLY'): EnrichedDonationRecord[] {
    const now = new Date();
    let startDate = new Date(0);
    if (timeframe === 'YEARLY') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (timeframe === 'MONTHLY') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return store.donationRecords
        .filter(d => d.tenantId === tenantId && d.donatedAt >= startDate)
        .map(donation => {
            const user = donation.userId ? getUserById(donation.userId) : null;
            return {
                ...donation,
                userAvatarUrl: user?.profile.avatarUrl,
            }
        })
        .sort((a,b) => b.donatedAt.getTime() - a.donatedAt.getTime());
}

/**
 * Corresponds to `donationService.createDonation()`.
 * Simulates: `POST /api/tenants/:tenantId/donations`
 * @param record The donation record to create.
 * @returns The created donation record.
 */
export function addDonationRecord(record: Omit<DonationRecord, 'id' | 'donatedAt'>): DonationRecord {
    const newRecord: DonationRecord = {
        ...record,
        id: `don-${Date.now()}`,
        donatedAt: new Date(),
    };
    updateStore({ donationRecords: [newRecord, ...store.donationRecords] });
    return newRecord;
}


// --- VOLUNTEER FUNCTIONS ---
/**
 * Corresponds to `volunteerService.getNeeds()`.
 * Simulates: `GET /api/tenants/:tenantId/volunteer-needs`
 * @param tenantId The ID of the tenant.
 * @returns An array of enriched volunteer needs.
 */
export function getVolunteerNeedsForTenant(tenantId: string): EnrichedVolunteerNeed[] {
  return store.volunteerNeeds
    .filter(need => need.tenantId === tenantId)
    .map(need => {
      const signups = store.volunteerSignups
        .filter(signup => signup.needId === need.id && signup.status === VolunteerStatus.CONFIRMED)
        .map(signup => {
            const user = getUserById(signup.userId);
            if (!user) return null;
            return { signup, user };
        })
        .filter((s): s is EnrichedSignup => s !== null);
      
      return { ...need, signups };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Corresponds to `volunteerService.createNeed()`.
 * Simulates: `POST /api/tenants/:tenantId/volunteer-needs`
 * @param needData The data for the new volunteer need.
 * @param actorUserId The ID of the admin creating the need.
 * @returns The new volunteer need object.
 */
export function addVolunteerNeed(needData: Omit<VolunteerNeed, 'id'>, actorUserId: string): VolunteerNeed {
  const newNeed: VolunteerNeed = {
    ...needData,
    id: `need-${Date.now()}`,
  };
  updateStore({ volunteerNeeds: [...store.volunteerNeeds, newNeed] });
  // Audit log would go here
  return newNeed;
}

/**
 * Corresponds to `volunteerService.signUp()`.
 * Simulates: `POST /api/volunteer-needs/:needId/signup`
 * @param needId The ID of the need to sign up for.
 * @param userId The ID of the user signing up.
 * @returns A boolean indicating success.
 */
export function signUpForNeed(needId: string, userId: string): boolean {
  const need = store.volunteerNeeds.find(n => n.id === needId);
  if (!need) return false;

  const currentSignups = store.volunteerSignups.filter(s => s.needId === needId && s.status === VolunteerStatus.CONFIRMED).length;
  if (currentSignups >= need.slotsNeeded) {
    alert('This volunteer opportunity is already full.');
    return false;
  }
  
  // Check if user is already signed up
  const existingSignup = store.volunteerSignups.find(s => s.needId === needId && s.userId === userId && s.status === VolunteerStatus.CONFIRMED);
  if (existingSignup) {
    return true; // Already signed up
  }

  const newSignup: VolunteerSignup = {
    id: `signup-${Date.now()}`,
    needId,
    userId,
    signedUpAt: new Date(),
    status: VolunteerStatus.CONFIRMED,
  };
  updateStore({ volunteerSignups: [...store.volunteerSignups, newSignup] });
  return true;
}

/**
 * Corresponds to `volunteerService.cancelSignUp()`.
 * Simulates: `DELETE /api/volunteer-needs/:needId/signup`
 * @param needId The ID of the need.
 * @param userId The ID of the user canceling.
 * @returns A boolean indicating success.
 */
export function cancelSignUp(needId: string, userId: string): boolean {
  const signupIndex = store.volunteerSignups.findIndex(s => s.needId === needId && s.userId === userId && s.status === VolunteerStatus.CONFIRMED);
  if (signupIndex === -1) return false;

  const updatedSignups = store.volunteerSignups.filter((_, index) => index !== signupIndex);
  // In a real app, we'd probably set status to CANCELED, but for this mock, removal is simpler.
  updateStore({ volunteerSignups: updatedSignups });
  return true;
}

// --- SMALL GROUP FUNCTIONS ---
/**
 * Corresponds to `groupService.getGroups()`.
 * Simulates: `GET /api/tenants/:tenantId/groups`
 * @param tenantId The ID of the tenant.
 * @returns An array of enriched small group objects.
 */
export function getSmallGroupsForTenant(tenantId: string): EnrichedSmallGroup[] {
  return store.smallGroups
    .filter(group => group.tenantId === tenantId)
    .map(group => {
      const leader = getUserById(group.leaderUserId);
      if (!leader) return null; // Should not happen

      const members = store.smallGroupMemberships
        .filter(m => m.groupId === group.id)
        .map(membership => {
            const user = getUserById(membership.userId);
            if (!user) return null;
            return { membership, user };
        })
        .filter((m): m is EnrichedGroupMember => m !== null);
      
      return { ...group, leader, members };
    })
    .filter((g): g is EnrichedSmallGroup => g !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Corresponds to `groupService.createGroup()`.
 * Simulates: `POST /api/tenants/:tenantId/groups`
 * @param data The data for the new group.
 * @param actorUserId The ID of the user creating the group.
 * @returns The new small group object.
 */
export function createSmallGroup(data: Omit<SmallGroup, 'id'>, actorUserId: string): SmallGroup {
    const newGroup: SmallGroup = {
        ...data,
        id: `sg-${Date.now()}`
    };
    const newMembership: SmallGroupMembership = {
        id: `sgm-${Date.now()}`,
        groupId: newGroup.id,
        userId: data.leaderUserId,
        role: SmallGroupRole.LEADER,
        joinedAt: new Date(),
    };
    updateStore({
        smallGroups: [...store.smallGroups, newGroup],
        smallGroupMemberships: [...store.smallGroupMemberships, newMembership],
    });
    return newGroup;
}

/**
 * Corresponds to `groupService.joinGroup()`.
 * Simulates: `POST /api/groups/:groupId/join`
 * @param groupId The ID of the group to join.
 * @param userId The ID of the user joining.
 * @returns A boolean indicating success.
 */
export function joinSmallGroup(groupId: string, userId: string): boolean {
    const existing = store.smallGroupMemberships.find(m => m.groupId === groupId && m.userId === userId);
    if (existing) return true; // Already a member

    const newMembership: SmallGroupMembership = {
        id: `sgm-${Date.now()}`,
        groupId,
        userId,
        role: SmallGroupRole.MEMBER,
        joinedAt: new Date(),
    };
    updateStore({ smallGroupMemberships: [...store.smallGroupMemberships, newMembership] });
    return true;
}

/**
 * Corresponds to `groupService.leaveGroup()`.
 * Simulates: `DELETE /api/groups/:groupId/leave`
 * @param groupId The ID of the group to leave.
 * @param userId The ID of the user leaving.
 * @returns A boolean indicating success.
 */
export function leaveSmallGroup(groupId: string, userId: string): boolean {
    const membership = store.smallGroupMemberships.find(m => m.groupId === groupId && m.userId === userId);
    if (!membership) return false;
    if (membership.role === SmallGroupRole.LEADER) {
        alert("A leader cannot leave their own group. Please assign a new leader first.");
        return false;
    }

    const updatedMemberships = store.smallGroupMemberships.filter(m => m.id !== membership.id);
    updateStore({ smallGroupMemberships: updatedMemberships });
    return true;
}

// --- PRAYER WALL FUNCTIONS ---
/**
 * Corresponds to `communityPostService.getPosts()`.
 * Simulates: `GET /api/tenants/:tenantId/community-posts`
 * @param tenantId The ID of the tenant.
 * @param includePending Whether to include posts pending approval (for admins).
 * @returns An array of enriched community posts.
 */
export function getCommunityPostsForTenant(tenantId: string, includePending: boolean = false): EnrichedCommunityPost[] {
    const anonymousUser = {
        id: 'anonymous',
        profile: { displayName: 'Anonymous', avatarUrl: 'https://i.pravatar.cc/48?u=anonymous' }
    };
    return store.communityPosts
        .filter(p => p.tenantId === tenantId && (includePending || p.status === CommunityPostStatus.PUBLISHED))
        .map(post => {
            const author = post.authorUserId ? getUserById(post.authorUserId) : anonymousUser;
            return {
                ...post,
                authorDisplayName: author?.profile.displayName || 'Anonymous',
                authorAvatarUrl: author?.profile.avatarUrl,
            }
        })
        .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Corresponds to `communityPostService.createPost()`.
 * Simulates: `POST /api/tenants/:tenantId/community-posts`
 * @param data The data for the new post.
 * @returns The newly created post object.
 */
export function addCommunityPost(data: Omit<CommunityPost, 'id' | 'createdAt' | 'status'>): CommunityPost {
    const newPost: CommunityPost = {
        ...data,
        id: `cpost-${Date.now()}`,
        status: CommunityPostStatus.PENDING_APPROVAL,
        createdAt: new Date(),
    };
    updateStore({ communityPosts: [newPost, ...store.communityPosts] });
    // Audit log can be added here
    return newPost;
}

/**
 * Corresponds to `communityPostService.updateStatus()`.
 * Simulates an admin endpoint to moderate posts.
 * @param postId The ID of the post.
 * @param status The new status.
 * @param actorUserId The ID of the admin performing the action.
 * @returns A boolean indicating success.
 */
export function updateCommunityPostStatus(postId: string, status: CommunityPostStatus, actorUserId: string): boolean {
    const postIndex = store.communityPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return false;
    
    const updatedPosts = [...store.communityPosts];
    updatedPosts[postIndex].status = status;
    updateStore({ communityPosts: updatedPosts });
    
    // Audit log can be added here
    return true;
}

// --- RESOURCE CENTER FUNCTIONS ---
/**
 * Corresponds to `resourceService.getResources()`.
 * Simulates: `GET /api/tenants/:tenantId/resources`
 * @param tenantId The ID of the tenant.
 * @param isMember Whether the requesting user is a member (to filter visibility).
 * @returns An array of enriched resource items.
 */
export function getResourceItemsForTenant(tenantId: string, isMember: boolean): EnrichedResourceItem[] {
    return store.resourceItems
        .filter(item => {
            if (item.tenantId !== tenantId) return false;
            if (item.visibility === ResourceVisibility.MEMBERS_ONLY && !isMember) return false;
            return true;
        })
        .map(item => {
            const uploader = getUserById(item.uploaderUserId);
            return {
                ...item,
                uploaderDisplayName: uploader?.profile.displayName || 'Unknown Uploader',
                uploaderAvatarUrl: uploader?.profile.avatarUrl,
            };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Corresponds to `resourceService.createResource()`.
 * Simulates: `POST /api/tenants/:tenantId/resources`
 * @param data The data for the new resource.
 * @returns The new resource item object.
 */
export function addResourceItem(data: Omit<ResourceItem, 'id' | 'createdAt'>): ResourceItem {
    const newItem: ResourceItem = {
        ...data,
        id: `res-${Date.now()}`,
        createdAt: new Date(),
    };
    updateStore({ resourceItems: [newItem, ...store.resourceItems] });
    // Audit log would go here
    return newItem;
}

/**
 * Corresponds to `resourceService.deleteResource()`.
 * Simulates: `DELETE /api/resources/:id`
 * @param resourceId The ID of the resource to delete.
 * @param actorUserId The ID of the user performing the deletion.
 * @returns A boolean indicating success.
 */
export function deleteResourceItem(resourceId: string, actorUserId: string): boolean {
    const initialLength = store.resourceItems.length;
    const updatedItems = store.resourceItems.filter(item => item.id !== resourceId);
    if (updatedItems.length === initialLength) return false; // Not found

    updateStore({ resourceItems: updatedItems });
    // Audit log would go here
    return true;
}

// --- CONTACT SUBMISSION FUNCTIONS ---
/**
 * Corresponds to `contactService.getSubmissions()`.
 * Simulates: `GET /api/tenants/:tenantId/contact-submissions`
 * @param tenantId The ID of the tenant.
 * @returns An array of contact submissions.
 */
export function getContactSubmissionsForTenant(tenantId: string): ContactSubmission[] {
    return store.contactSubmissions
        .filter(s => s.tenantId === tenantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Corresponds to `contactService.createSubmission()`.
 * Simulates: `POST /api/tenants/:tenantId/contact`
 * @param data The data for the new submission.
 * @returns The new contact submission object.
 */
export function addContactSubmission(data: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>): ContactSubmission {
    const newSubmission: ContactSubmission = {
        ...data,
        id: `contact-${Date.now()}`,
        status: ContactSubmissionStatus.UNREAD,
        createdAt: new Date(),
    };
    updateStore({ contactSubmissions: [newSubmission, ...store.contactSubmissions] });

    // Generate notification for admins/staff
    const tenant = getTenantById(newSubmission.tenantId);
    if (tenant) {
        const membersWithPermission = getMembersForTenant(tenant.id).filter(member =>
            member.membership.status === MembershipStatus.APPROVED && can(member, tenant, 'canManageContactSubmissions')
        );

        membersWithPermission.forEach(member => {
            generateNotification({
                userId: member.id,
                type: 'NEW_CONTACT_SUBMISSION',
                message: `New contact submission from "${newSubmission.name}" received for ${tenant.name}.`,
                link: `tenant/${tenant.id}`,
            });
        });
    }
    
    return newSubmission;
}

/**
 * Corresponds to `contactService.updateStatus()`.
 * Simulates an admin endpoint to update a submission's status.
 * @param submissionId The ID of the submission.
 * @param status The new status.
 * @param actorUserId The ID of the user performing the action.
 * @returns A boolean indicating success.
 */
export function updateContactSubmissionStatus(submissionId: string, status: ContactSubmissionStatus, actorUserId: string): boolean {
    const submissionIndex = store.contactSubmissions.findIndex(s => s.id === submissionId);
    if (submissionIndex === -1) return false;
    
    const updatedSubmissions = [...store.contactSubmissions];
    updatedSubmissions[submissionIndex].status = status;
    updateStore({ contactSubmissions: updatedSubmissions });
    
    // Audit log can be added here
    return true;
}

/**
 * Corresponds to `contactService.respondToSubmission()`.
 * Simulates sending a response to a contact submission, which involves
 * sending an in-app message (if the user exists) and a simulated email.
 * @param submissionId The ID of the submission.
 * @param responseText The text of the response.
 * @param adminUserId The ID of the admin responding.
 * @param tenantName The name of the tenant for context.
 * @returns A boolean indicating success.
 */
export function respondToContactSubmission(submissionId: string, responseText: string, adminUserId: string, tenantName: string): boolean {
    const submissionIndex = store.contactSubmissions.findIndex(s => s.id === submissionId);
    if (submissionIndex === -1) return false;
    
    const submission = store.contactSubmissions[submissionIndex];
    const adminUser = getUserById(adminUserId);

    // 1. Check for a matching user and send an in-app message
    const targetUser = store.users.find(u => u.email.toLowerCase() === submission.email.toLowerCase());

    if (targetUser && adminUser) {
        const conversation = getOrCreateDirectConversation(adminUserId, targetUser.id);
        const messageBody = `Regarding your inquiry to ${tenantName}:\n\n"${submission.message}"\n\n---\n\n${responseText}`;
        addMessage(conversation.id, adminUserId, messageBody);
    }
    
    // 2. Simulate sending an email
    console.log('--- EMAIL SENT (SIMULATED) ---');
    console.log(`From: ${adminUser?.email} (on behalf of ${tenantName})`);
    console.log(`To: ${submission.email}`);
    console.log(`Subject: Re: Your inquiry to ${tenantName}`);
    console.log('Body:', responseText);
    console.log('--- END EMAIL ---');

    // 3. Update submission status if it's unread
    if (submission.status === ContactSubmissionStatus.UNREAD) {
        const updatedSubmissions = [...store.contactSubmissions];
        updatedSubmissions[submissionIndex] = { ...submission, status: ContactSubmissionStatus.READ };
        updateStore({ contactSubmissions: updatedSubmissions });
    }
    
    // Log audit event could be added here
    return true;
}
