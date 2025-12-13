// --- ENUMS ---

export enum TenantRole {
  MEMBER = 'MEMBER',
  STAFF = 'STAFF',
  LEADER = 'LEADER',
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

export enum OnboardingStatus {
  PENDING = 'PENDING',
  PACKET_QUEUED = 'PACKET_QUEUED',
  PACKET_SENT = 'PACKET_SENT',
  COMPLETED = 'COMPLETED',
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
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',
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
  customLinks: Array<{ label: string; url: string; showInFooter?: boolean }>;
  socialLinks?: Array<{ platform: string; url: string; label?: string; showInFooter?: boolean }>;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
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
  enableTalks: boolean;
  enableSermons?: boolean;
  enablePodcasts: boolean;
  enablePhotos: boolean;
  enableBooks: boolean;
  enableMemberDirectory: boolean;
  enableGroupChat: boolean;
  enableComments: boolean;
  enableReactions: boolean;
  enableServices: boolean;
  enableDonations: boolean;
  enableRecurringPledges?: boolean;
  enableTranslation?: boolean;
  enableMemorials?: boolean;
  enableVanityDomains?: boolean;
  enableAssetManagement?: boolean;
  enableWorkboard?: boolean;
  enableTicketing?: boolean;
  enableMemberNotes?: boolean;
  enableVolunteering: boolean;
  enableSmallGroups: boolean;
  enableTrips: boolean;
  enableLiveStream: boolean;
  enableSupportRequests: boolean;
  autoApproveSupportRequests: boolean;
  enableResourceCenter: boolean;
  enablePrayerWall: boolean;
  autoApprovePrayerWall?: boolean;
  enableTripFundraising?: boolean;
  tripCalendarColor?: string;
  enableBirthdays?: boolean;
  donationSettings: DonationSettings;
  liveStreamSettings: LiveStreamSettings;
  translationSettings?: TranslationSettings;
  // Visibility (simplified for mock)
  visitorVisibility: {
    calendar: boolean;
    events?: boolean;
    posts: boolean;
    talks: boolean;
    podcasts: boolean;
    books: boolean;
    supportRequests: boolean;
    photos?: boolean;
  };
  welcomePacketUrl?: string | null;
  welcomePacketVersion?: number | null;
  newMemberAlertChannels?: string[];
}


export interface RolePermissions {
  canCreatePosts: boolean;
  canCreateEvents: boolean;
  canCreateTalks: boolean;
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
  canManageSupportRequests: boolean;
  canUploadResources: boolean;
  canManageResources: boolean;
  canManageContactSubmissions: boolean;
  canManageFacilities: boolean;
  canViewWorkMenu?: boolean;
  canManagePrayerWall: boolean;
  canManageServices: boolean;
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
  welcomePacketUrl?: string | null;
  welcomePacketVersion?: number | null;
  onboardingStatus?: OnboardingStatus;
  alertSentAt?: Date | null;
  alertChannels?: string[];
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
  recurrenceRule?: string | null;
  recurrenceGroupId?: string | null;
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
  type: 'TALK_VIDEO' | 'PODCAST_AUDIO';
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
  TENANT_BRANDING_SOCIAL_LINK_CREATED = 'TENANT_BRANDING_SOCIAL_LINK_CREATED',
  TENANT_BRANDING_SOCIAL_LINK_UPDATED = 'TENANT_BRANDING_SOCIAL_LINK_UPDATED',
  TENANT_BRANDING_SOCIAL_LINK_DELETED = 'TENANT_BRANDING_SOCIAL_LINK_DELETED',
  DONATION_FUND_CREATED = 'DONATION_FUND_CREATED',
  DONATION_FUND_UPDATED = 'DONATION_FUND_UPDATED',
  DONATION_FUND_ARCHIVED = 'DONATION_FUND_ARCHIVED',
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
  | 'NEW_CONTACT_SUBMISSION'
  | 'DONATION_FUND_UPDATED';

export interface Notification {
  id: string;
  userId: string; // The recipient
  actorUserId?: string; // The user who caused the notification
  actorDisplayName?: string;
  actorAvatarUrl?: string | null;
  type: NotificationType;
  message: string;
  link?: string; // e.g., messages, tenant/tenant-1
  isRead: boolean;
  createdAt: Date;
}

// --- DONATION MODELS ---
export type FundType = 'TITHE' | 'OFFERING' | 'PROJECT' | 'SPECIAL';

export type FundVisibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'HIDDEN';

export interface TranslationSettings {
  allowedLanguages: string[];
  defaultLanguage: string;
  autoTranslateUserContent: boolean;
  glossary?: Record<string, Record<string, string>>; // { term: { lang: translation } }
  costLimitPerMonth?: number; // in USD
  rateLimitPerMinute?: number;
  excludedFields?: string[]; // fields to not translate
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', rtl: false },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Memorial types
export type MemorialStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MemorialPrivacy = 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';

export interface Memorial {
  id: string;
  tenantId: string;
  name: string;
  birthDate?: Date | null;
  deathDate?: Date | null;
  story?: string | null;
  photos: string[];
  tags: string[];
  privacy: MemorialPrivacy;
  status: MemorialStatus;
  submitterId?: string | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
  rejectedById?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  linkedFundId?: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemorialTribute {
  id: string;
  memorialId: string;
  userId?: string | null;
  authorName?: string | null;
  content: string;
  isApproved: boolean;
  isReported: boolean;
  reportReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface EnrichedMemorial extends Memorial {
  submitter?: { displayName: string; avatarUrl?: string } | null;
  approvedBy?: { displayName: string } | null;
  linkedFund?: { name: string; id: string } | null;
  tributes?: (MemorialTribute & { user?: { displayName: string; avatarUrl?: string } | null })[];
  tributeCount?: number;
}

// Vanity Domain types
export type VanityDomainStatus =
  | 'PENDING_VERIFICATION'
  | 'DNS_VERIFIED'
  | 'SSL_PROVISIONING'
  | 'ACTIVE'
  | 'SSL_EXPIRED'
  | 'DISABLED'
  | 'ERROR';

export type VanityDomainType = 'FULL_DOMAIN' | 'SUBDOMAIN' | 'PATH_PREFIX';

export interface VanityDomain {
  id: string;
  tenantId: string;
  domain: string;
  domainType: VanityDomainType;
  isPrimary: boolean;
  status: VanityDomainStatus;
  verificationToken: string;
  verificationMethod: string;
  verifiedAt?: Date | null;
  lastVerificationCheck?: Date | null;
  verificationAttempts: number;
  sslStatus?: string | null;
  sslExpiresAt?: Date | null;
  sslProviderRef?: string | null;
  sslLastRenewalAt?: Date | null;
  redirectToSlug: boolean;
  forceHttps: boolean;
  wwwRedirect?: string | null;
  totalRequests: number;
  lastRequestAt?: Date | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  disabledAt?: Date | null;
  disabledReason?: string | null;
  deletedAt?: Date | null;
}

export interface VanityDomainWithDetails extends VanityDomain {
  tenant?: { name: string; slug: string };
}

// Asset Management types
export type AssetStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'RESERVED'
  | 'RETIRED'
  | 'DISPOSED';

export type AssetCondition =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'DAMAGED'
  | 'UNKNOWN';

export type AssetCategory =
  | 'EQUIPMENT'
  | 'FURNITURE'
  | 'VEHICLE'
  | 'BUILDING'
  | 'SUPPLIES'
  | 'INSTRUMENTS'
  | 'LITURGICAL'
  | 'KITCHEN'
  | 'GROUNDS'
  | 'OTHER';

export type AssetEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'CHECKED_OUT'
  | 'CHECKED_IN'
  | 'MAINTENANCE_SCHEDULED'
  | 'MAINTENANCE_COMPLETED'
  | 'CONDITION_UPDATED'
  | 'LOCATION_CHANGED'
  | 'RESERVED'
  | 'UNRESERVED'
  | 'RETIRED'
  | 'DISPOSED';

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  category: AssetCategory;
  serialNumber?: string | null;
  barcode?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  conditionNotes?: string | null;
  location?: string | null;
  storageLocation?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  purchasedFrom?: string | null;
  warrantyExpires?: Date | null;
  currentValue?: number | null;
  depreciationType?: string | null;
  usefulLifeYears?: number | null;
  salvageValue?: number | null;
  assignedToId?: string | null;
  assignedAt?: Date | null;
  dueBackAt?: Date | null;
  lastMaintenanceAt?: Date | null;
  nextMaintenanceAt?: Date | null;
  maintenanceNotes?: string | null;
  photos?: string[];
  documents?: string[];
  tags?: string[];
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  retiredAt?: Date | null;
  disposedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface AssetEvent {
  id: string;
  assetId: string;
  eventType: AssetEventType;
  description?: string | null;
  notes?: string | null;
  userId?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  previousCondition?: string | null;
  newCondition?: string | null;
  maintenanceCost?: number | null;
  maintenanceVendor?: string | null;
  previousLocation?: string | null;
  newLocation?: string | null;
  performedBy?: string | null;
  performedAt: Date;
  dueBackAt?: Date | null;
  createdAt: Date;
}

export interface AssetWithDetails extends Asset {
  assignedTo?: { displayName: string; avatarUrl?: string } | null;
  events?: AssetEvent[];
  eventCount?: number;
}

// --- Task / Workboard Types ---

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TaskRecurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  createdById: string;
  dueDate?: Date | null;
  startDate?: Date | null;
  completedAt?: Date | null;
  recurrence: TaskRecurrence;
  recurrenceEndDate?: Date | null;
  parentTaskId?: string | null;
  labels?: string | null; // JSON array
  orderIndex: number;
  boardColumn?: string | null;
  attachments?: string | null; // JSON array
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions?: string | null; // JSON array
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TaskCommentWithAuthor extends TaskComment {
  author: { id: string; displayName: string; avatarUrl?: string };
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
}

export interface TaskActivityWithUser extends TaskActivity {
  user: { id: string; displayName: string; avatarUrl?: string };
}

export interface TaskWithDetails extends Task {
  assignee?: { id: string; displayName: string; avatarUrl?: string } | null;
  createdBy: { id: string; displayName: string; avatarUrl?: string };
  comments?: TaskCommentWithAuthor[];
  commentCount?: number;
  activities?: TaskActivityWithUser[];
}

// --- Ticket Types ---

export type TicketStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory = 'GENERAL' | 'TECHNICAL' | 'BILLING' | 'MEMBERSHIP' | 'FACILITIES' | 'EVENTS' | 'OTHER';
export type TicketSource = 'WEB_FORM' | 'EMAIL' | 'PHONE' | 'IN_PERSON';

export interface Ticket {
  id: string;
  tenantId: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  source: TicketSource;
  requesterId?: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  assigneeId?: string | null;
  slaResponseDue?: Date | null;
  slaResolveDue?: Date | null;
  slaBreached: boolean;
  firstResponseAt?: Date | null;
  attachments?: string | null; // JSON array
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface TicketUpdate {
  id: string;
  ticketId: string;
  authorId?: string | null;
  authorName: string;
  content: string;
  isInternal: boolean;
  isSystemGenerated: boolean;
  previousStatus?: string | null;
  newStatus?: string | null;
  attachments?: string | null;
  createdAt: Date;
}

export interface TicketUpdateWithAuthor extends TicketUpdate {
  author?: { id: string; displayName: string; avatarUrl?: string } | null;
}

export interface TicketWithDetails extends Ticket {
  requester?: { id: string; displayName: string; avatarUrl?: string } | null;
  assignee?: { id: string; displayName: string; avatarUrl?: string } | null;
  updates?: TicketUpdateWithAuthor[];
  updateCount?: number;
}

// --- Member Notes Types ---

export type NoteCategory = 'GENERAL' | 'CARE' | 'HOSPITAL' | 'MENTORSHIP' | 'PERSONAL_CARE' | 'COUNSELING' | 'SUPPORT' | 'FOLLOW_UP';
export type NoteVisibility = 'PRIVATE' | 'STAFF' | 'LEADERSHIP' | 'ADMIN_ONLY';
export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ESCALATED';

export interface MemberNote {
  id: string;
  tenantId: string;
  memberId: string;
  authorId: string;
  category: NoteCategory;
  visibility: NoteVisibility;
  title?: string | null;
  content: string;
  followUpDate?: Date | null;
  followUpStatus?: FollowUpStatus | null;
  assignedToId?: string | null;
  escalatedToId?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  recurrenceEnd?: Date | null;
  attachments?: string | null;
  tags?: string | null;
  linkedTaskId?: string | null;
  linkedTicketId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface MemberNoteWithDetails extends MemberNote {
  member: { id: string; displayName: string; avatarUrl?: string };
  author: { id: string; displayName: string; avatarUrl?: string };
  assignedTo?: { id: string; displayName: string; avatarUrl?: string } | null;
  escalatedTo?: { id: string; displayName: string; avatarUrl?: string } | null;
}

export interface HospitalVisit {
  id: string;
  tenantId: string;
  memberId: string;
  visitorId: string;
  hospitalName?: string | null;
  roomNumber?: string | null;
  visitDate: Date;
  duration?: number | null;
  supportOffered: boolean;
  serviceProvided: boolean;
  familyContacted: boolean;
  notes?: string | null;
  outcome?: string | null;
  nextSteps?: string | null;
  followUpDate?: Date | null;
  followUpAssignedToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HospitalVisitWithDetails extends HospitalVisit {
  member: { id: string; displayName: string; avatarUrl?: string };
  visitor: { id: string; displayName: string; avatarUrl?: string };
  followUpAssignedTo?: { id: string; displayName: string; avatarUrl?: string } | null;
}

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

export interface Fund {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: FundType;
  visibility: FundVisibility;
  currency: string;
  goalAmountCents?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  minAmountCents?: number | null;
  maxAmountCents?: number | null;
  allowAnonymous: boolean;
  archivedAt?: Date | null;
  campaignMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundWithProgress extends Fund {
  amountRaisedCents: number;
}

export interface DonationRecord {
  id: string;
  tenantId: string;
  userId: string | null; // null for anonymous from public page
  displayName: string; // denormalized for anonymous/guest donations
  fundId: string;
  amount: number;
  currency: string;
  donatedAt: Date;
  isAnonymousOnLeaderboard: boolean;
  message?: string;
  designationNote?: string;
  campaignMetadata?: Record<string, any>;
  paymentBrand?: string;
  paymentLast4?: string;
}

export interface EnrichedDonationRecord extends DonationRecord {
  userAvatarUrl?: string;
  fundName?: string;
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

// --- RECURRING PLEDGES MODELS ---
export enum PledgeFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum PledgeStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export interface Pledge {
  id: string;
  tenantId: string;
  userId: string;
  fundId: string;
  amountCents: number;
  currency: string;
  frequency: PledgeFrequency;
  startDate: Date | string;
  endDate?: Date | string | null;
  nextChargeAt: Date | string;
  paymentMethodToken?: string | null;
  paymentMethodLast4?: string | null;
  paymentMethodBrand?: string | null;
  status: PledgeStatus;
  failureCount: number;
  totalChargesCount: number;
  totalAmountCents: number;
  lastChargedAt?: Date | string | null;
  lastFailedAt?: Date | string | null;
  lastFailureReason?: string | null;
  isAnonymous: boolean;
  dedicationNote?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  cancelledAt?: Date | string | null;
  pausedAt?: Date | string | null;
}

export interface PledgeCharge {
  id: string;
  pledgeId: string;
  amountCents: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  attemptCount: number;
  chargedAt?: Date | string | null;
  failedAt?: Date | string | null;
  failureReason?: string | null;
  transactionId?: string | null;
  receiptSentAt?: Date | string | null;
  createdAt: Date | string;
}

export interface PledgeSettings {
  id: string;
  tenantId: string;
  maxFailuresBeforePause: number;
  retryIntervalHours: number;
  dunningEmailDays: number[];
  gracePeriodDays: number;
  autoResumeOnSuccess: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EnrichedPledge extends Pledge {
  fund?: Fund;
  user?: User;
  charges?: PledgeCharge[];
}
