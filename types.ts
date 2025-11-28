// --- ENUMS ---

export enum TenantRole {
  MEMBER = 'MEMBER',
  STAFF = 'STAFF',
  CLERGY = 'CLERGY',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

// Role types for permission mapping
export enum TenantRoleType {
  MEMBER = 'MEMBER',
  STAFF = 'STAFF',
  MODERATOR = 'MODERATOR',
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BANNED = 'BANNED',
}

export enum MembershipApprovalMode {
  OPEN = 'OPEN',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
}

export enum VolunteerStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
}

export type JoinPolicy = 'OPEN' | 'APPROVAL';

export enum SmallGroupRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

export enum TripStatus {
  PLANNING = 'PLANNING',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  ARCHIVED = 'ARCHIVED',
}

export enum TripMemberRole {
  LEADER = 'LEADER',
  CO_LEADER = 'CO_LEADER',
  MEMBER = 'MEMBER',
  SUPPORT = 'SUPPORT',
}

export enum TravelSegmentType {
  BUS = 'BUS',
  FLIGHT = 'FLIGHT',
  TRAIN = 'TRAIN',
  BOAT = 'BOAT',
  CARPOOL = 'CARPOOL',
  LODGING = 'LODGING',
  OTHER = 'OTHER',
}

export enum TripDonationStatus {
  PLEDGED = 'PLEDGED',
  AUTHORIZED = 'AUTHORIZED',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}

export enum CommunityPostType {
    PRAYER_REQUEST = 'PRAYER_REQUEST',
    TANGIBLE_NEED = 'TANGIBLE_NEED',
}

export enum CommunityPostStatus {
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    PUBLISHED = 'PUBLISHED',
    FULFILLED = 'FULFILLED',
}

export enum ResourceVisibility {
    PUBLIC = 'PUBLIC',
    MEMBERS_ONLY = 'MEMBERS_ONLY',
}

export enum FileType {
    PDF = 'PDF',
    DOCX = 'DOCX',
    MP3 = 'MP3',
    JPG = 'JPG',
    PNG = 'PNG',
    OTHER = 'OTHER',
}

export enum ContactSubmissionStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
    ARCHIVED = 'ARCHIVED',
}

export type ServiceCategory = 'CEREMONY' | 'EDUCATION' | 'FACILITY' | 'COUNSELING' | 'OTHER';

export enum RSVPStatus {
    GOING = 'GOING',
    INTERESTED = 'INTERESTED',
    NOT_GOING = 'NOT_GOING',
}

// NotificationType is defined in schema.prisma and exported from @prisma/client


// --- USER-RELATED MODELS ---
export interface NotificationPreferences {
  email: {
    newAnnouncement: boolean;
    newEvent: boolean;
    directMessage: boolean;
    groupChatMessage: boolean;
    membershipUpdate: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  password: string | null; // NOTE: For mock login simulation, made compatible with Prisma
  isSuperAdmin: boolean;
  profile: UserProfile | null;
  privacySettings?: UserPrivacySettings | null;
  accountSettings?: AccountSettings | null;
  notificationPreferences?: NotificationPreferences | any | null;
}

export interface UserProfile {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  // Some server payloads serialize languages as a comma-separated string or null; allow either shape
  languages?: string[] | string | null;
  birthDate?: string | Date | null;
  isBirthdayPublic?: boolean;
}

export interface UserPrivacySettings {
  showAffiliations: boolean;
}

export interface AccountSettings {
  timezonePreference?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  languagePreference?: string | null;
}


// --- TENANT-RELATED MODELS ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  creed: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactEmail?: string;
  phoneNumber?: string;
  description: string;
  settings: TenantSettings;
  branding: TenantBranding;
  permissions: TenantFeaturePermissions;
}

export interface TenantBranding {
  logoUrl: string;
  bannerImageUrl: string;
  primaryColor: string;
  accentColor: string;
  customLinks: Array<{ label: string; url: string }>;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
}

export interface ServiceOffering {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: ServiceCategory;
  isPublic: boolean;
  requiresBooking: boolean;
  contactEmailOverride?: string | null;
  pricing?: string | null;
  imageUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type FacilityType = 'ROOM' | 'HALL' | 'EQUIPMENT' | 'VEHICLE' | 'OTHER';

export type BookingStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Facility {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  type: FacilityType;
  location?: string | null;
  capacity?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  bookingRules?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityBlackout {
  id: string;
  tenantId: string;
  facilityId: string;
  reason?: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface FacilityBooking {
  id: string;
  tenantId: string;
  facilityId: string;
  requestedById: string;
  eventId?: string | null;
  startAt: string;
  endAt: string;
  purpose: string;
  status: BookingStatus;
  notes?: string | null;
  createdAt: string;
}

export interface LiveStreamSettings {
  provider: 'YOUTUBE' | 'FACEBOOK' | 'VIMEO' | 'OTHER';
  embedUrl: string;
  isLive: boolean; // Manual toggle by admin
}

export interface TenantSettings {
  isPublic: boolean;
  membershipApprovalMode: MembershipApprovalMode;
  // Features
  enableCalendar: boolean;
  enableEvents?: boolean;
  enablePosts: boolean;
  enableSermons: boolean;
  enablePodcasts: boolean;
  enablePhotos: boolean;
  enableBooks: boolean;
  enableMemberDirectory: boolean;
  enableGroupChat: boolean;
  enableComments: boolean;
  enableReactions: boolean;
  enableServices: boolean;
  enableDonations: boolean;
  enableVolunteering: boolean;
  enableSmallGroups: boolean;
  enableTrips: boolean;
  enableLiveStream: boolean;
  enablePrayerWall: boolean;
  autoApprovePrayerWall: boolean;
  enableResourceCenter: boolean;
  enableTripFundraising?: boolean;
  tripCalendarColor?: string;
  enableBirthdays?: boolean;
  donationSettings: DonationSettings;
  liveStreamSettings: LiveStreamSettings;
  // Visibility (simplified for mock)
  visitorVisibility: {
    calendar: boolean;
    events?: boolean;
    posts: boolean;
    sermons: boolean;
    podcasts: boolean;
    books: boolean;
    prayerWall: boolean;
    photos?: boolean;
  };
}


export interface RolePermissions {
  canCreatePosts: boolean;
  canCreateEvents: boolean;
  canCreateSermons: boolean;
  canCreatePodcasts: boolean;
  canCreateBooks: boolean;
  canCreateGroupChats: boolean;
  canInviteMembers: boolean;
  canApproveMembership: boolean;
  canBanMembers: boolean;
  canModeratePosts: boolean;
  canModerateChats: boolean;
  canPostInAnnouncementChannels?: boolean;
  canManagePrayerWall: boolean;
  canUploadResources: boolean;
  canManageResources: boolean;
  canManageContactSubmissions: boolean;
  canManageFacilities: boolean;
}

// Sticking with a map for easier frontend access
export type TenantFeaturePermissions = {
  [key in TenantRoleType]?: RolePermissions;
} & { ADMIN: RolePermissions };


export interface UserTenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  status: MembershipStatus;
  roles: UserTenantRole[];
  displayName?: string; // Tenant-specific display name override
}

export interface UserTenantRole {
    id: string;
    role: TenantRole;
    displayTitle?: string;
    isPrimary: boolean;
}

// Enriched type for displaying members in the UI
export interface EnrichedMember extends User {
  membership: UserTenantMembership;
}


// --- CONTENT & MESSAGING (Largely Unchanged) ---

export interface Post {
  id: string;
  tenantId: string;
  authorUserId: string;
  type: 'BLOG' | 'ANNOUNCEMENT' | 'BOOK';
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt: Date;
}
export interface PostInput {
  title: string;
  body: string;
  type: 'BLOG' | 'ANNOUNCEMENT' | 'BOOK';
  isPublished: boolean;
}
export interface PostWithAuthor extends Post {
    authorDisplayName: string;
    authorAvatarUrl?: string;
}

export interface PostComment {
  id: string;
  tenantId: string;
  postId: string;
  authorUserId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostCommentWithAuthor extends PostComment {
  authorDisplayName: string;
  authorAvatarUrl?: string;
}

export interface Event {
  id: string;
  tenantId: string;
  createdByUserId: string;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  locationText: string;
  isOnline: boolean;
  onlineUrl: string | null;
  deletedAt?: Date | null;
  isAllDay?: boolean;
  posterStorageKey?: string | null;
  posterUrl?: string | null;
}
export interface EventWithCreator extends Event {
    creatorDisplayName: string;
    creatorAvatarUrl: string | null;
    rsvpCount: number;
    currentUserRsvpStatus?: RSVPStatus | null;
    kind?: 'event' | 'trip' | 'birthday';
    tripId?: string;
    birthdayUserId?: string;
}

export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  id: string;
  tenantId: string;
  authorUserId: string;
  type: 'SERMON_VIDEO' | 'PODCAST_AUDIO';
  title: string;
  description: string;
  embedUrl: string;
  publishedAt: Date;
}
export interface EnrichedMediaItem extends MediaItem {
  authorDisplayName: string;
  authorAvatarUrl?: string;
  artworkUrl?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  text: string;
  createdAt: Date;
  isDeleted?: boolean;
}

export interface EnrichedChatMessage extends ChatMessage {
  userDisplayName: string;
  userAvatarUrl?: string;
}

export enum ConversationScope {
  GLOBAL = 'GLOBAL',
  TENANT = 'TENANT',
}

export enum ConversationKind {
  DM = 'DM',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export interface Conversation {
  id: string;
  // legacy boolean for older payloads — prefer `kind` and `scope`.
  isDirect: boolean;
  // New canonical fields
  scope: ConversationScope;
  kind: ConversationKind;
  tenantId: string | null;
  isPrivateGroup: boolean;
  name?: string; // For group channels
  description?: string; // Description for channels
  createdByUserId: string;
  isDefaultChannel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadMessageId?: string | null;
}

export interface EnrichedConversation extends Conversation {
    participants: User[];
    unreadCount: number;
    lastMessage?: EnrichedChatMessage;
    displayName: string;
}


// --- ADMIN & AUDIT TYPES ---

export enum ActionType {
  IMPERSONATE_START = 'IMPERSONATE_START',
  IMPERSONATE_END = 'IMPERSONATE_END',
  CREATE_POST = 'CREATE_POST',
  DELETE_POST = 'DELETE_POST',
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  USER_JOINED_TENANT = 'USER_JOINED_TENANT',
  MEMBERSHIP_STATUS_UPDATED = 'MEMBERSHIP_STATUS_UPDATED',
  MEMBER_ROLES_UPDATED = 'MEMBER_ROLES_UPDATED',
  MEMBERSHIP_PROFILE_UPDATED = 'MEMBERSHIP_PROFILE_UPDATED',
  USER_REGISTERED = 'USER_REGISTERED',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  ADMIN_UPDATED_USER_PROFILE = 'ADMIN_UPDATED_USER_PROFILE',
  TENANT_PERMISSIONS_UPDATED = 'TENANT_PERMISSIONS_UPDATED',
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  effectiveUserId?: string;
  actionType: ActionType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// --- NOTIFICATION MODELS ---
export type NotificationType =
  | 'NEW_DIRECT_MESSAGE'
  | 'NEW_ANNOUNCEMENT'
  | 'MEMBERSHIP_APPROVED'
  | 'NEW_CONTACT_SUBMISSION';

export interface Notification {
  id: string;
  userId: string; // The recipient
  actorUserId?: string; // The user who caused the notification
  type: NotificationType;
  message: string;
  link?: string; // e.g., messages, tenant/tenant-1
  isRead: boolean;
  createdAt: Date;
}

// --- DONATION MODELS ---
export interface DonationSettings {
  mode: 'EXTERNAL' | 'INTEGRATED';
  externalUrl?: string;
  integratedProvider?: 'STRIPE' | 'PAYPAL';
  currency: string;
  suggestedAmounts: number[];
  allowCustomAmounts: boolean;
  leaderboardEnabled: boolean;
  leaderboardVisibility: 'PUBLIC' | 'MEMBERS_ONLY';
  leaderboardTimeframe: 'ALL_TIME' | 'YEARLY' | 'MONTHLY';
  paypalUrl?: string;
  venmoHandle?: string;
  zelleEmail?: string;
  cashAppTag?: string;
  mailingAddress?: string;
  taxId?: string;
  bankTransferInstructions?: string;
  textToGiveNumber?: string;
  otherGivingNotes?: string;
  otherGivingLinks?: Array<{ label: string; url: string }>;
}

export interface DonationRecord {
  id: string;
  tenantId: string;
  userId: string | null; // null for anonymous from public page
  displayName: string; // denormalized for anonymous/guest donations
  amount: number;
  currency: string;
  donatedAt: Date;
  isAnonymousOnLeaderboard: boolean;
  message?: string;
}

export interface EnrichedDonationRecord extends DonationRecord {
    userAvatarUrl?: string;
}

// --- VOLUNTEER MODELS ---
export interface VolunteerNeed {
  id: string;
  tenantId: string;
  eventId?: string; // Optional link to an Event
  title: string;
  description: string;
  date: Date;
  slotsNeeded: number;
  location?: string;
}

export interface VolunteerSignup {
  id: string;
  needId: string;
  userId: string;
  signedUpAt: Date;
  status: VolunteerStatus;
}

// Enriched types for UI
export interface EnrichedSignup {
  signup: VolunteerSignup;
  user: User;
}

export interface EnrichedVolunteerNeed extends VolunteerNeed {
  signups: EnrichedSignup[];
}

// --- SMALL GROUP MODELS ---
export interface SmallGroup {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  leaderUserId: string;
  meetingSchedule: string; // e.g., "Tuesdays at 7 PM"
  isActive: boolean;
  isHidden?: boolean;
}

export interface SmallGroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: SmallGroupRole;
  joinedAt: Date;
  status: MembershipStatus;
  addedByUserId?: string;
  leftAt?: Date | null;
}

// Enriched types for UI
export interface EnrichedGroupMember {
    membership?: SmallGroupMembership;
    user: User;
    status?: MembershipStatus;
    role?: SmallGroupRole;
    addedByUserId?: string;
    joinedAt?: Date | string;
    leftAt?: Date | string | null;
}

export interface EnrichedSmallGroup extends SmallGroup {
    leader: User;
    members: EnrichedGroupMember[];
}

// --- TRIP MODELS ---
export interface Trip {
  id: string;
  tenantId: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  leaderUserId?: string | null;
  coLeaderUserId?: string | null;
  createdByUserId?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  departureLocation?: string | null;
  destination?: string | null;
  meetingPoint?: string | null;
  status: TripStatus;
  joinPolicy: JoinPolicy;
  capacity?: number | null;
  waitlistEnabled?: boolean;
  costCents?: number | null;
  currency?: string;
  depositCents?: number | null;
  allowPartialPayments?: boolean;
  allowScholarships?: boolean;
  allowMessages?: boolean;
  allowPhotos?: boolean;
  waiverRequired?: boolean;
  waiverUrl?: string | null;
  formUrl?: string | null;
  packingList?: Record<string, any> | null;
  housingDetails?: string | null;
  transportationNotes?: string | null;
  itineraryJson?: Record<string, any> | null;
  travelDetails?: Record<string, any> | null;
  safetyNotes?: string | null;
  fundraisingEnabled?: boolean;
  fundraisingGoalCents?: number | null;
  fundraisingDeadline?: Date | string | null;
  fundraisingVisibility?: string | null;
  allowSponsorship?: boolean;
  colorHex?: string | null;
  isPublic?: boolean;
  isHidden?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  archivedAt?: Date | null;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  status: MembershipStatus;
  joinedAt: Date | string;
  leftAt?: Date | string | null;
  waiverAcceptedAt?: Date | string | null;
  emergencyContact?: Record<string, any> | null;
  travelPreferences?: Record<string, any> | null;
  notes?: string | null;
}

export interface TripItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  location?: string | null;
  order?: number | null;
}

export interface TripTravelSegment {
  id: string;
  tripId: string;
  type: TravelSegmentType;
  carrier?: string | null;
  segmentNumber?: string | null;
  departAt?: Date | string | null;
  arriveAt?: Date | string | null;
  departLocation?: string | null;
  arriveLocation?: string | null;
  confirmationCode?: string | null;
  notes?: string | null;
}

export interface TripMessage {
  id: string;
  tripId: string;
  authorUserId: string;
  body: string;
  createdAt: Date | string;
}

export interface TripPhoto {
  id: string;
  tripId: string;
  uploadedById: string;
  imageUrl: string;
  caption?: string | null;
  phase?: string | null;
  createdAt: Date | string;
}

export interface TripDonation {
  id: string;
  tripId: string;
  donorUserId?: string | null;
  sponsoredUserId?: string | null;
  amountCents: number;
  currency: string;
  status: TripDonationStatus;
  message?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  coverFees?: boolean;
  createdAt: Date | string;
}

export interface EnrichedTripMember extends TripMember {
  user: User;
}

export interface EnrichedTrip extends Trip {
  leader?: User | null;
  coLeader?: User | null;
  members: EnrichedTripMember[];
  itineraryItems?: TripItineraryItem[];
  travelSegments?: TripTravelSegment[];
  donations?: TripDonation[];
  messages?: TripMessage[];
  photos?: TripPhoto[];
}

// --- COMMUNITY BOARD / PRAYER WALL MODELS ---
export interface CommunityPost {
    id: string;
    tenantId: string;
    authorUserId: string | null; // Null for anonymous
    type: CommunityPostType;
    body: string;
    isAnonymous: boolean;
    status: CommunityPostStatus;
    createdAt: Date;
}

export interface EnrichedCommunityPost extends CommunityPost {
    authorDisplayName: string;
    authorAvatarUrl?: string;
}

// --- RESOURCE CENTER MODELS ---
export interface ResourceItem {
    id: string;
    tenantId: string;
    uploaderUserId: string;
    title: string;
    description: string;
    fileUrl: string; // For mock, this is just a string. In real app, it would be a URL to a file.
    fileType: FileType;
    visibility: ResourceVisibility;
    createdAt: Date;
}

export interface EnrichedResourceItem extends ResourceItem {
    uploaderDisplayName: string;
    uploaderAvatarUrl?: string;
}

// --- CONTACT & SUBMISSIONS ---
export interface ContactSubmission {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    message: string;
    status: ContactSubmissionStatus;
    createdAt: Date;
}
