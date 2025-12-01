import { prisma } from './db';
import {
  Prisma,
  Tenant,
  User,
  Post,
  Event,
  UserTenantMembership,
  Notification,
  AuditLog,
  Conversation,
  TenantSettings as PrismaTenantSettings,
  TenantBranding as PrismaTenantBranding,
  CommunityPost as PrismaCommunityPost,
  ServiceOffering as PrismaServiceOffering,
  ServiceCategory,
  Facility as PrismaFacility,
  FacilityBooking as PrismaFacilityBooking,
  FacilityBlackout as PrismaFacilityBlackout,
  FacilityType,
  BookingStatus,
  UserTenantRole,
  ContactSubmission,
} from '@prisma/client';
import { DonationRecord, EnrichedDonationRecord, TenantRole, MembershipStatus, TenantSettings, TenantBranding, CommunityPost, CommunityPostStatus, ContactSubmissionStatus } from '@/types';
import { EnrichedResourceItem } from '@/types';
import bcrypt from 'bcryptjs';
import { listTenantEvents, mapEventDtoToClient } from './services/event-service';
import { listTenantPosts, mapPostDtoToClient } from './services/post-service';
import MessageService from '@/lib/services/message-service';

export type TenantWithRelations = Tenant & {
  settings: TenantSettings | null;
  branding: TenantBranding | null;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
};

export type UserWithProfileSettings = Prisma.UserGetPayload<{
  include: { profile: true; privacySettings: true; accountSettings: true };
}>;

export type MemberWithMembership = UserWithProfileSettings & {
  membership: (UserTenantMembership & { roles: UserTenantRole[] });
};

export type VolunteerNeedWithSignups = Prisma.VolunteerNeedGetPayload<{
  include: { signups: { include: { user: { include: { profile: true } } } } };
}>;

interface ServiceOfferingInput {
  name: string;
  description: string;
  category: ServiceCategory;
  isPublic?: boolean;
  requiresBooking?: boolean;
  contactEmailOverride?: string | null;
  pricing?: string | null;
  imageUrl?: string | null;
  order?: number;
}

interface FacilityInput {
  name: string;
  description?: string | null;
  type: FacilityType;
  location?: string | null;
  capacity?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
  bookingRules?: Record<string, any> | null;
}

interface FacilityBookingInput {
  facilityId: string;
  tenantId: string;
  requestedById: string;
  startAt: Date;
  endAt: Date;
  purpose: string;
  eventId?: string | null;
  notes?: string | null;
}

interface FacilityBlackoutInput {
  facilityId: string;
  tenantId: string;
  startAt: Date;
  endAt: Date;
  reason?: string | null;
}

export interface TenantDataExport {
  tenant: Tenant & { settings: PrismaTenantSettings | null; branding: PrismaTenantBranding | null };
  members: Array<{
    id: string;
    status: MembershipStatus;
    roles: TenantRole[];
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      createdAt: Date;
      profile: any;
    };
  }>;
  posts: Array<Post & { author?: { id: string; email: string; profile: any } | null }>;
  events: Array<Event & { creator?: { id: string; email: string; profile: any } | null }>;
  services: PrismaServiceOffering[];
  facilities: Array<
    PrismaFacility & {
      bookings: PrismaFacilityBooking[];
      blackouts: PrismaFacilityBlackout[];
    }
  >;
  contactSubmissions: ContactSubmission[];
}

function assertFacilityClient() {
  if (!(prisma as any)?.facility || !(prisma as any)?.facilityBlackout || !(prisma as any)?.facilityBooking) {
    throw new Error('Prisma client is missing facility models. Run `prisma generate` to sync the client with the schema.');
  }
}

/**
 * Get all tenants that a user is an approved member of
 * @param userId - The ID of the user
 * @returns Array of tenants where the user has APPROVED membership status
 */
export type TenantWithBrandingAndSettings = Prisma.TenantGetPayload<{
  include: { settings: true; branding: true };
}>;

export async function getTenantsForUser(userId: string): Promise<TenantWithBrandingAndSettings[]> {
  try {
    const memberships = await prisma.userTenantMembership.findMany({
      where: {
        userId,
        status: 'APPROVED',
      },
      include: {
        tenant: {
          include: {
            settings: true,
            branding: true,
          },
        },
      },
    });

    return memberships.map((membership) => membership.tenant);
  } catch (err: any) {
    // If the Prisma client/schema is out of sync (missing columns), avoid crashing the whole app in dev.
    if (process.env.NODE_ENV === 'development') {
       
      console.error('getTenantsForUser: database query failed - returning empty tenant list as fallback', err?.message || err);
    }
    return [];
  }
}

/**
 * Get a tenant by ID with its settings, branding, and address information
 * @param tenantId - The ID of the tenant to retrieve
 * @returns Tenant with settings, branding, and address, or null if not found
 */
export async function getTenantById(tenantId: string): Promise<TenantWithRelations | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      branding: true,
    },
  });
  
  if (!tenant) return null;

  // Return tenant with proper types - settings and branding are nullable in the relation
  return {
    ...tenant,
    address: {
      street: tenant.street,
      city: tenant.city,
      state: tenant.state,
      country: tenant.country,
      postalCode: tenant.postalCode,
    },
  };
}

/**
 * Get a user by ID with profile, privacy settings, and account settings
 * @param userId - The ID of the user to retrieve
 * @returns User with all related data, or null if not found
 */
export async function getUserById(userId: string): Promise<UserWithProfileSettings | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      privacySettings: true,
      accountSettings: true,
    },
  });
}

export async function createFacilityBlackout(data: FacilityBlackoutInput): Promise<PrismaFacilityBlackout> {
  if (data.startAt >= data.endAt) {
    throw new Error('Blackout start time must be before the end time');
  }

  assertFacilityClient();

  return prisma.facilityBlackout.create({
    data: {
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      startAt: data.startAt,
      endAt: data.endAt,
      reason: data.reason ?? null,
    },
  });
}

/**
 * Get all tenants with their settings and branding
 * @returns Array of all tenants with settings, branding, and address information
 */
export async function getTenants(): Promise<TenantWithRelations[]> {
    const tenants = await prisma.tenant.findMany({
        include: {
            settings: true,
            branding: true,
        }
    });
    
    // Transform Prisma data to include nested address
    return tenants.map((tenant: any) => ({
        ...tenant,
        address: {
            street: tenant.street,
            city: tenant.city,
            state: tenant.state,
            country: tenant.country,
            postalCode: tenant.postalCode,
        },
    }));
}

export async function exportTenantData(tenantId: string): Promise<TenantDataExport | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true, branding: true },
  });

  if (!tenant) {
    return null;
  }

  const memberships = await prisma.userTenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
      roles: true,
    },
  });

  const posts = await prisma.post.findMany({
    where: { tenantId },
    orderBy: [{ publishedAt: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: [{ startDateTime: 'asc' }],
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  const services = await prisma.serviceOffering.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const facilities = (prisma as any)?.facility
    ? await prisma.facility.findMany({
        where: { tenantId },
        include: { bookings: true, blackouts: true },
      })
    : [];

  const contactSubmissions = await prisma.contactSubmission.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: 'desc' }],
  });

  return {
    tenant,
    members: memberships.map((membership) => ({
      id: membership.id,
      status: membership.status as MembershipStatus,
      roles: membership.roles.map((role) => role.role as TenantRole),
      joinedAt: new Date(), // Fallback since createdAt is missing
      user: {
        id: membership.user.id,
        email: membership.user.email,
        createdAt: new Date(), // Fallback since it's not in the model
        profile: membership.user.profile,
      },
    })),
    posts: posts.map((post) => ({
      ...post,
      author: post.author
        ? {
            id: post.author.id,
            email: post.author.email,
            profile: post.author.profile,
          }
        : null,
    })),
    events: events.map((event) => ({
      ...event,
      creator: event.creator
        ? {
            id: event.creator.id,
            email: event.creator.email,
            profile: event.creator.profile,
          }
        : null,
    })),
    services,
    facilities,
    contactSubmissions,
  };
}

/**
 * Get all events for a specific tenant, ordered by start date
 * Includes creator information with display name and avatar
 * @param tenantId - The ID of the tenant
 * @param currentUserId - Optional user id to include the viewer's RSVP status
 * @returns Array of events with enriched creator information
 */
export async function getEventsForTenant(tenantId: string, currentUserId?: string) {
  const events = await listTenantEvents({ tenantId, viewerUserId: currentUserId });
  return events.map(mapEventDtoToClient);
}

/**
 * Get all published posts for a specific tenant, ordered by publish date (newest first)
 * Only returns posts where isPublished is true
 * @param tenantId - The ID of the tenant
 * @returns Array of published posts with author information
 */
export async function getPostsForTenant(tenantId: string, currentUserId?: string) {
  const { posts } = await listTenantPosts({ tenantId, viewerUserId: currentUserId ?? null, publishedOnly: true });
  return posts.map(mapPostDtoToClient);
}

/**
 * Get the membership record for a specific user in a specific tenant
 * @param userId - The ID of the user
 * @param tenantId - The ID of the tenant
 * @returns The membership record, or null if the user is not a member
 */
export async function getMembershipForUserInTenant(userId: string, tenantId: string): Promise<UserTenantMembership | null> {
  return await prisma.userTenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      }
    },
    include: {
      roles: {
        select: { role: true },
      },
    },
  });
}

export async function getServiceOfferingsForTenant(
  tenantId: string,
  options?: { includePrivate?: boolean; category?: ServiceCategory }
) {
  const where: any = {
    tenantId,
    deletedAt: null,
  };

  if (!options?.includePrivate) {
    where.isPublic = true;
  }

  if (options?.category) {
    where.category = options.category;
  }

  return prisma.serviceOffering.findMany({
    where,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });
}

export async function getServiceOfferingById(tenantId: string, serviceId: string, includePrivate = false) {
  const service = await prisma.serviceOffering.findFirst({
    where: {
      id: serviceId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!service) {
    return null;
  }

  if (!includePrivate && !service.isPublic) {
    return null;
  }

  return service;
}

export async function createServiceOffering(tenantId: string, data: ServiceOfferingInput): Promise<PrismaServiceOffering> {
  return prisma.serviceOffering.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      category: data.category,
      isPublic: data.isPublic ?? true,
      requiresBooking: data.requiresBooking ?? false,
      contactEmailOverride: data.contactEmailOverride || null,
      pricing: data.pricing || null,
      imageUrl: data.imageUrl || null,
      order: data.order ?? 0,
    },
  });
}

export async function updateServiceOffering(
  tenantId: string,
  serviceId: string,
  data: Partial<ServiceOfferingInput>
): Promise<PrismaServiceOffering | null> {
  const existing = await prisma.serviceOffering.findFirst({
    where: { id: serviceId, tenantId, deletedAt: null },
  });

  if (!existing) {
    return null;
  }

  return prisma.serviceOffering.update({
    where: { id: existing.id },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      category: data.category ?? existing.category,
      isPublic: data.isPublic ?? existing.isPublic,
      requiresBooking: data.requiresBooking ?? existing.requiresBooking,
      contactEmailOverride:
        data.contactEmailOverride === undefined ? existing.contactEmailOverride : data.contactEmailOverride || null,
      pricing: data.pricing === undefined ? existing.pricing : data.pricing || null,
      imageUrl: data.imageUrl === undefined ? existing.imageUrl : data.imageUrl || null,
      order: data.order ?? existing.order,
    },
  });
}

export async function deleteServiceOffering(tenantId: string, serviceId: string): Promise<boolean> {
  const result = await prisma.serviceOffering.updateMany({
    where: { id: serviceId, tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return result.count > 0;
}

export async function getFacilitiesForTenant(
  tenantId: string,
  options?: { includeInactive?: boolean }
): Promise<PrismaFacility[]> {
  assertFacilityClient();

  const where = {
    tenantId,
    ...(options?.includeInactive ? {} : { isActive: true }),
  };

  return prisma.facility.findMany({
    where,
    orderBy: [{ name: 'asc' }],
  });
}

export async function getFacilityById(tenantId: string, facilityId: string, includeInactive = false) {
  assertFacilityClient();

  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      tenantId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      bookings: {
        where: {
          status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
          endAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
        },
        orderBy: { startAt: 'asc' },
      },
      blackouts: {
        where: { endAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) } },
        orderBy: { startAt: 'asc' },
      },
    },
  });

  return facility;
}

export async function createFacility(tenantId: string, data: FacilityInput): Promise<PrismaFacility> {
  assertFacilityClient();

  return prisma.facility.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      location: data.location ?? null,
      capacity: data.capacity ?? null,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
      bookingRules: (data.bookingRules as any) ?? null,
    },
  });
}

export async function updateFacility(tenantId: string, facilityId: string, data: Partial<FacilityInput>) {
  assertFacilityClient();

  const existing = await prisma.facility.findFirst({ where: { id: facilityId, tenantId } });

  if (!existing) return null;

  return prisma.facility.update({
    where: { id: existing.id },
    data: {
      name: data.name ?? existing.name,
      description: data.description === undefined ? existing.description : data.description,
      type: data.type ?? existing.type,
      location: data.location === undefined ? existing.location : data.location,
      capacity: data.capacity === undefined ? existing.capacity : data.capacity,
      imageUrl: data.imageUrl === undefined ? existing.imageUrl : data.imageUrl,
      isActive: data.isActive ?? existing.isActive,
      bookingRules: data.bookingRules === undefined ? (existing.bookingRules as any) : (data.bookingRules as any),
    },
  });
}

export async function deleteFacility(tenantId: string, facilityId: string): Promise<boolean> {
  assertFacilityClient();

  const existing = await prisma.facility.findFirst({ where: { id: facilityId, tenantId } });

  if (!existing) return false;
  // Soft-delete: mark facility as inactive so it is hidden by default
  await prisma.facility.update({ where: { id: existing.id }, data: { isActive: false } });
  return true;
}

export async function checkFacilityAvailability(
  tenantId: string,
  facilityId: string,
  startAt: Date,
  endAt: Date,
  options?: { excludeBookingId?: string }
) {
  assertFacilityClient();

  const blackoutConflict = await prisma.facilityBlackout.findFirst({
    where: {
      tenantId,
      facilityId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (blackoutConflict) {
    return false;
  }

  const conflict = await prisma.facilityBooking.findFirst({
    where: {
      tenantId,
      facilityId,
      status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
      ...(options?.excludeBookingId ? { id: { not: options.excludeBookingId } } : {}),
      OR: [
        { startAt: { lt: endAt }, endAt: { gt: startAt } },
        { startAt: { gte: startAt, lt: endAt } },
      ],
    },
  });

  return !conflict;
}

export async function requestFacilityBooking(data: FacilityBookingInput): Promise<PrismaFacilityBooking | null> {
  if (data.startAt >= data.endAt) {
    throw new Error('Start time must be before end time');
  }

  assertFacilityClient();

  const facility = await prisma.facility.findFirst({
    where: { id: data.facilityId, tenantId: data.tenantId, isActive: true },
  });

  if (!facility) {
    return null;
  }

  const available = await checkFacilityAvailability(data.tenantId, data.facilityId, data.startAt, data.endAt);

  if (!available) {
    return null;
  }

  return prisma.facilityBooking.create({
    data: {
      tenantId: data.tenantId,
      facilityId: data.facilityId,
      requestedById: data.requestedById,
      startAt: data.startAt,
      endAt: data.endAt,
      purpose: data.purpose,
      eventId: data.eventId ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateFacilityBookingStatus(
  tenantId: string,
  bookingId: string,
  status: BookingStatus,
  notes?: string | null
) {
  assertFacilityClient();

  const booking = await prisma.facilityBooking.findFirst({ where: { id: bookingId, tenantId } });

  if (!booking) return null;

  if (status === BookingStatus.APPROVED) {
    const available = await checkFacilityAvailability(tenantId, booking.facilityId, booking.startAt, booking.endAt, {
      excludeBookingId: booking.id,
    });

    if (!available) {
      throw new Error('Facility is not available for the selected time');
    }
  }

  return prisma.facilityBooking.update({
    where: { id: booking.id },
    data: { status, notes: notes ?? booking.notes },
  });
}

export async function getFacilityBookings(
  tenantId: string,
  facilityId?: string,
  statuses: BookingStatus[] = [BookingStatus.REQUESTED, BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED]
) {
  assertFacilityClient();

  return prisma.facilityBooking.findMany({
    where: {
      tenantId,
      ...(facilityId ? { facilityId } : {}),
      status: { in: statuses },
    },
    orderBy: { startAt: 'asc' },
    include: { facility: true, requestedBy: true },
  });
}

export async function getFacilityCalendar(
  tenantId: string,
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  assertFacilityClient();

  return prisma.facilityBooking.findMany({
    where: {
      tenantId,
      facilityId,
      startAt: { gte: startDate },
      endAt: { lte: endDate },
      status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
    },
    orderBy: { startAt: 'asc' },
  });
}

/**
 * Get all notifications for a user, ordered by creation date (newest first)
 * @param userId - The ID of the user
 * @returns Array of notifications with normalized optional fields
 */
export async function getNotificationsForUser(userId: string) {
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    
    return notifications.map((notif: any) => ({
        ...notif,
        actorUserId: notif.actorUserId ?? undefined,
        link: notif.link ?? undefined,
    }));
}

/**
 * Mark a single notification as read
 * @param notificationId - The ID of the notification
 * @returns The updated notification record
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
}

/**
 * Mark all notifications as read for a specific user
 * @param userId - The ID of the user
 * @returns Update result with count of affected records
 */
export async function markAllNotificationsAsRead(userId: string) {
    return await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
    });
}

/**
 * Get a user by their email address
 * Includes profile, privacy settings, and account settings
 * @param email - The email address to search for
 * @returns User with all related data, or null if not found
 */
export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
        include: {
            profile: true,
            privacySettings: true,
            accountSettings: true,
        },
    });
}

/**
 * Register a new user with hashed password and create associated profile/settings
 * @param displayName - The display name for the user's profile
 * @param email - The user's email address (must be unique)
 * @param pass - The plaintext password (will be hashed with bcrypt)
 * @returns Success object with user data, or error object if email already exists
 */
export async function registerUser(displayName: string, email: string, pass: string) {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return { success: false, message: 'User with this email already exists.' };
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            profile: {
                create: {
                    displayName,
                },
            },
            accountSettings: { create: {} },
            privacySettings: { create: {} },
        },
        include: {
            profile: true,
            privacySettings: true,
            accountSettings: true,
        }
    });
    return { success: true, user };
}

/**
 * Create a new tenant and automatically assign the creator as ADMIN
 * Generates a URL-safe slug from the tenant name
 * @param tenantDetails - Tenant information (excluding id, slug, and permissions)
 * @param ownerId - The user ID who will be the initial admin
 * @returns The created tenant record
 */
export async function createTenant(tenantDetails: Omit<Tenant, 'id' | 'slug' | 'permissions'>, ownerId: string): Promise<Tenant> {
    const tenant = await prisma.tenant.create({
        data: {
            ...tenantDetails as any, // TODO: Ticket #0002 - Type alignment needed
            slug: tenantDetails.name.toLowerCase().replace(/ /g, '-'),
            memberships: {
                create: {
                    userId: ownerId,
                    roles: {
                        create: {
                            role: TenantRole.ADMIN,
                        }
                    },
                    status: MembershipStatus.APPROVED,
                }
            },
            settings: { 
                create: {
                    isPublic: false,
                    membershipApprovalMode: 'APPROVAL_REQUIRED',
                    enableCalendar: true,
                    enablePosts: true,
                    enableSermons: true,
                    enablePodcasts: true,
                enablePhotos: true,
                    enableBooks: true,
                    enableDonations: true,
                    enableVolunteering: true,
                    enableSmallGroups: true,
                    enableLiveStream: true,
                    enablePrayerWall: true,
                    autoApprovePrayerWall: false,
                    enableResourceCenter: true,
                    visitorVisibility: {},
                    donationSettings: {},
                    liveStreamSettings: {},
                } 
            },
            branding: { 
                create: {
                    logoUrl: '',
                    bannerImageUrl: '',
                    primaryColor: '#000000',
                    accentColor: '#FFFFFF',
                    customLinks: [],
                } 
            },
        }
    });
    return tenant;
}

export async function updateTenant(tenant: Partial<TenantWithRelations>): Promise<Tenant> {
    const { id, settings, branding, ...data } = tenant;
    
    const updateData: any = { ...data };

    if (settings) {
        const { id: settingsId, tenantId: settingsTenantId, ...restOfSettings } = settings;
        updateData.settings = {
            update: {
                ...restOfSettings,
                visitorVisibility: restOfSettings.visitorVisibility || undefined,
                donationSettings: restOfSettings.donationSettings || undefined,
                liveStreamSettings: restOfSettings.liveStreamSettings || undefined,
            }
        };
    }

    if (branding) {
        const { id: brandingId, tenantId: brandingTenantId, ...restOfBranding } = branding;
        updateData.branding = {
            update: {
                ...restOfBranding,
                customLinks: restOfBranding.customLinks || undefined,
            }
        };
    }

    return await prisma.tenant.update({
        where: { id },
        data: updateData,
    });
}

export async function requestToJoinTenant(userId: string, tenantId: string): Promise<UserTenantMembership> {
    const existingMembership = await getMembershipForUserInTenant(userId, tenantId);
if (existingMembership) {
        return existingMembership;
    }
    return await prisma.userTenantMembership.create({
        data: {
            userId,
            tenantId,
            roles: {
                create: {
                    role: TenantRole.MEMBER,
                }
            },
            status: MembershipStatus.PENDING,
        }
    });
}

// NOTE: These are not secure and are for demonstration only.
// In a real app, you'd use secure tokens and a proper reset flow.
export async function requestPasswordReset(email: string): Promise<boolean> {
    const user = await getUserByEmail(email);
    if (!user) return false;
    // In a real app, generate a token, save it, and email a link.
    console.log(`Password reset requested for ${email}. In this demo, we'll just allow a direct reset.`);
    return true;
}

export async function resetPassword(email: string, newPass: string) {
    const user = await getUserByEmail(email);
    if (!user) return { success: false, message: "User not found." };
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });
    return { success: true };
}

export async function logAuditEvent(event: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    return await prisma.auditLog.create({
        data: {
            ...event as any, // TODO: Ticket #0002 - Type alignment needed
            metadata: event.metadata || {},
        },
    });
}

export async function getOrCreateDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    const existing = await prisma.conversation.findFirst({
        where: {
            isDirectMessage: true,
            participants: {
                every: {
                    userId: { in: [userId1, userId2] }
                }
            }
        },
        include: { participants: true }
    });

    if (existing) return existing;

    try {
      return await prisma.conversation.create({
        data: {
          isDirectMessage: true,
          scope: 'GLOBAL',
          kind: 'DM',
          participants: {
            create: [
              { userId: userId1 },
              { userId: userId2 },
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                include: {
                  profile: true,
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
    } catch (err: any) {
      // Handle race where another process created the conversation concurrently
      if (err?.code === 'P2002') {
        const fallback = await prisma.conversation.findFirst({
          where: {
            isDirectMessage: true,
            AND: [
              { participants: { some: { userId: userId1 } } },
              { participants: { some: { userId: userId2 } } },
            ],
          },
          include: {
            participants: {
              include: { user: { include: { profile: true } } },
            },
            tenant: { select: { id: true, name: true } },
          },
        });

        if (fallback) return fallback;
      }

      throw err;
    }
}

export async function getConversationsForUser(userId: string) {
    return await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    userId: userId
                }
            }
        },
        include: {
            participants: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            },
            messages: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            }
        },
        orderBy: {
            id: 'desc'
        }
    });
}

/**
 * Create a tenant-scoped channel and add all APPROVED tenant members
 * as ConversationParticipant rows in a single transaction.
 * Returns the created conversation with participant user profiles included.
 */
export async function createChannelWithAllMembers(
  tenantId: string,
  actorUserId: string,
  data: { name?: string }
) {
  // Verify actor is an approved member
  const membership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId: actorUserId, tenantId } }
  });

  if (!membership || membership.status !== 'APPROVED') {
    throw new Error('Actor must be an approved tenant member to create a channel');
  }

  // Fetch approved member ids
  const approved = await prisma.userTenantMembership.findMany({
    where: { tenantId, status: 'APPROVED' },
    select: { userId: true }
  });

  const userIds = Array.from(new Set(approved.map((m) => m.userId)));
  if (!userIds.includes(actorUserId)) userIds.push(actorUserId);

  // Create conversation and participants in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        tenantId,
        name: data.name,
        isDirectMessage: false,
        scope: 'TENANT',
        kind: 'CHANNEL',
      }
    });

    // Create participant rows
    const participantRecords = userIds.map((uid) => ({ conversationId: conversation.id, userId: uid }));
    await Promise.all(participantRecords.map((rec) => tx.conversationParticipant.create({ data: rec })));

    // Return the fully-enriched conversation
    const created = await tx.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
            lastReadMessage: true,
          }
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { user: { include: { profile: true } } }
        },
        tenant: { select: { id: true, name: true } }
      }
    });

    return created;
  });

  return result;
}

/**
 * @deprecated Use actor-aware APIs in `lib/services/message-service.ts`.
 * This function is kept for backward compatibility but will be removed in a future release.
 */
export async function getMessagesForConversation(conversationId: string) {
  console.warn('DEPRECATION: getMessagesForConversation is deprecated. Use MessageService.getMessagesForConversation(actorUserId, conversationId)');
  return await prisma.chatMessage.findMany({
    where: {
      conversationId: conversationId
    },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

/**
 * @deprecated Use `MessageService.addMessage(actorUserId, conversationId, content)` instead.
 */
export async function addMessage(conversationId: string, senderId: string, content: string) {
  console.warn('DEPRECATION: addMessage is deprecated. Use MessageService.addMessage(actorUserId, conversationId, content)');
  // Delegate to the actor-aware service using the provided senderId as the actor
  return await MessageService.addMessage(senderId, conversationId, content);
}

/**
 * @deprecated Use `MessageService.deleteMessage(actorUserId, messageId)` instead.
 * Note: this legacy helper performs an unconditional delete and is retained only for compatibility.
 */
export async function deleteMessage(messageId: string) {
  console.warn('DEPRECATION: deleteMessage is deprecated. Use MessageService.deleteMessage(actorUserId, messageId) for actor-aware deletion.');
  return await prisma.chatMessage.delete({ where: { id: messageId } });
}

// New actor-aware convenience wrappers that delegate to MessageService
export async function getMessagesForConversationAs(actorUserId: string, conversationId: string) {
  return await MessageService.getMessagesForConversation(actorUserId, conversationId);
}

export async function addMessageAs(actorUserId: string, conversationId: string, content: string) {
  return await MessageService.addMessage(actorUserId, conversationId, content);
}

export async function deleteMessageAs(actorUserId: string, messageId: string) {
  return await MessageService.deleteMessage(actorUserId, messageId);
}

export async function markConversationAsRead(conversationId: string, userId: string) {
    // This would update read receipts via ConversationParticipant's lastReadMessageId
    // For now, just return success
    return { success: true };
}

export async function getAllUsers() {
    return await prisma.user.findMany({
        include: {
            profile: true
        }
    });
}

export async function getAuditLogs() {
    return await prisma.auditLog.findMany({
        include: {
            actorUser: {
                include: {
                    profile: true
                }
            },
            effectiveUser: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 100
    });
}

// Get enriched memberships for a user (includes tenant details)
export async function getEnrichedMembershipsForUser(userId: string) {
    const memberships = await prisma.userTenantMembership.findMany({
        where: { userId },
        include: {
            tenant: {
                include: {
                    settings: true,
                    branding: true,
                }
            }
        }
    });
    
    return memberships.map((m: any) => ({
        membership: m,
        tenant: m.tenant
    }));
}

// Update membership profile (display name within a tenant)
export async function updateMembershipProfile(
    userId: string, 
    membershipId: string, 
    data: { displayName?: string }
) {
    return await prisma.userTenantMembership.update({
        where: { id: membershipId, userId },
        data: {
            displayName: data.displayName,
        }
    });
}

// Update user notification preferences
export async function updateUserNotificationPreferences(
    userId: string,
    preferences: any
) {
    // Note: This assumes notification preferences are stored in a JSON field or separate table
    // Adjust based on your actual schema
    return await prisma.user.update({
        where: { id: userId },
        data: {
            // If you have a notificationPreferences JSON field:
            // notificationPreferences: preferences
        }
    });
}

// ===== MISSING FUNCTION STUBS =====
// These functions are called by components but not yet fully implemented

export async function getMembersForTenant(tenantId: string): Promise<MemberWithMembership[]> {
  const memberships = await prisma.userTenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        include: {
          profile: true,
          privacySettings: true,
          accountSettings: true,
        },
      },
      roles: true,
    },
    orderBy: [{ user: { profile: { displayName: 'asc' } } }],
  });

  return memberships.map((membership) => ({
    ...membership.user,
    membership: {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      status: membership.status,
      displayName: membership.displayName,
      roles: membership.roles,
    },
  }));
}

export async function updateMembershipStatus(userId: string, tenantId: string, status: string) {
    return prisma.userTenantMembership.update({
        where: {
            userId_tenantId: {
                userId,
                tenantId,
            },
        },
        data: { status: status as any },
    });
}

export async function updateMemberRolesAndTitle(membershipId: string, roles: any[], userId?: string) {
    const [primaryRole] = roles.filter((role) => role.isPrimary);

    await prisma.userTenantRole.deleteMany({ where: { membershipId } });

    await prisma.userTenantRole.createMany({
        data: roles.map((role) => ({
            membershipId,
            role: role.role,
            isPrimary: role.isPrimary || false,
            displayTitle: role.displayTitle || null,
        })),
    });

    if (primaryRole?.displayTitle) {
        await prisma.userTenantMembership.update({
            where: { id: membershipId },
            data: { displayName: primaryRole.displayTitle },
        });
    }
}

export async function getSmallGroupsForTenant(tenantId: string) {
    const groups = await prisma.smallGroup.findMany({
        where: { tenantId },
        include: {
            members: {
                include: {
                    user: {
                        include: {
                            profile: true,
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' },
    });

    // Fetch leaders separately for enrichment
    const enrichedGroups = await Promise.all(groups.map(async (group: any) => {
      let leader = null;
      if (group.leaderUserId) {
        try {
          leader = await prisma.user.findUnique({
            where: { id: group.leaderUserId },
            include: {
              profile: true,
              privacySettings: true,
              accountSettings: true,
            }
          });
        } catch (err) {
          // Defensive: if Prisma validation or other error occurs, log and continue without leader
          // This prevents a single bad group row from crashing the tenant page.
           
          console.error(`Failed to load leader for group ${group.id}:`, err);
          leader = null;
        }
      }

        return {
          ...group,
          leader: leader || null,
          members: group.members.map((m: any) => ({
            id: m.id,
            role: m.role,
            status: m.status,
            addedByUserId: m.addedByUserId,
            joinedAt: m.joinedAt,
            leftAt: m.leftAt,
            user: m.user,
          }))
        };
    }));

    return enrichedGroups;
}

export async function getSmallGroupById(groupId: string) {
  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { include: { profile: true } }
        }
      }
    }
  });

  if (!group) return null;

  const leader = group.leaderUserId
    ? await prisma.user.findUnique({ where: { id: group.leaderUserId }, include: { profile: true } })
    : null;

  return {
    ...group,
    leader,
    members: group.members.map((m: any) => ({
      ...m.user,
      groupRole: m.role,
      joinedAt: m.joinedAt,
      status: m.status,
      leftAt: m.leftAt,
    })),
  };
}

export async function createSmallGroup(tenantId: string, groupData: any, createdByUserId?: string) {
  // Minimal validation / defaults
  if (!groupData || !groupData.name) {
    throw new Error('Small group must include a name');
  }

  const data: any = {
    tenantId,
    name: groupData.name,
    description: groupData.description ?? null,
    slug: groupData.slug ?? null,
    category: groupData.category ?? null,
    imageUrl: groupData.imageUrl ?? null,
    dayOfWeek: groupData.dayOfWeek ?? null,
    startTime: groupData.startTime ?? null,
    frequency: groupData.frequency ?? null,
    format: groupData.format ?? null,
    locationName: groupData.locationName ?? null,
    locationAddress: groupData.locationAddress ?? null,
    onlineMeetingLink: groupData.onlineMeetingLink ?? null,
    leaderUserId: groupData.leaderUserId ?? null,
    meetingSchedule: groupData.meetingSchedule ?? null,
    status: groupData.status ?? undefined,
    joinPolicy: groupData.joinPolicy ?? undefined,
    capacity: groupData.capacity ?? null,
    ageFocus: groupData.ageFocus ?? null,
    language: groupData.language ?? null,
    hasChildcare: groupData.hasChildcare ?? false,
    tags: groupData.tags ?? null,
    isPublic: groupData.isPublic ?? false,
    isActive: groupData.isActive ?? true,
    createdByUserId: createdByUserId ?? null,
  };

  const group = await prisma.smallGroup.create({ data });

  // If a leader user was provided, ensure they are added as an APPROVED member with role LEADER
  if (group.leaderUserId) {
    try {
      await prisma.smallGroupMembership.create({
        data: {
          groupId: group.id,
          userId: group.leaderUserId,
          role: 'LEADER',
          status: 'APPROVED',
          addedByUserId: createdByUserId ?? group.leaderUserId,
        }
      });
    } catch (e) {
      // ignore unique constraint errors if membership already exists
    }
  }

  return group;
}

export async function joinSmallGroup(tenantId: string, groupId: string, userId: string) {
  const group = await prisma.smallGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error('Group not found');
  if (group.tenantId !== tenantId) throw new Error('Tenant mismatch');

  // Check capacity
  if (group.capacity && group.capacity > 0) {
    const approvedCount = await prisma.smallGroupMembership.count({ where: { groupId, status: 'APPROVED' } });
    if (approvedCount >= group.capacity) {
      throw new Error('Group is full');
    }
  }

  // If user already has membership, return it
  const existing = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (existing) return existing;

  const status = group.joinPolicy === 'OPEN' ? 'APPROVED' : 'PENDING';

  const membership = await prisma.smallGroupMembership.create({
    data: {
      groupId,
      userId,
      role: 'MEMBER',
      status,
      addedByUserId: userId,
    }
  });

  // If membership is approved and capacity reached, update group status to FULL
  if (status === 'APPROVED' && group.capacity && group.capacity > 0) {
    const approvedCount = await prisma.smallGroupMembership.count({ where: { groupId, status: 'APPROVED' } });
    if (approvedCount >= group.capacity) {
      await prisma.smallGroup.update({ where: { id: groupId }, data: { status: 'FULL' } });
    }
  }

  return membership;
}

export async function approveSmallGroupMember(groupId: string, userId: string, approverId?: string) {
  const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw new Error('Membership not found');

  const updated = await prisma.smallGroupMembership.update({
    where: { id: membership.id },
    data: { status: 'APPROVED', addedByUserId: approverId ?? membership.addedByUserId },
  });

  // Re-check capacity and mark group as FULL if necessary
  const group = await prisma.smallGroup.findUnique({ where: { id: groupId } });
  if (group && group.capacity && group.capacity > 0) {
    const approvedCount = await prisma.smallGroupMembership.count({ where: { groupId, status: 'APPROVED' } });
    if (approvedCount >= group.capacity) {
      await prisma.smallGroup.update({ where: { id: groupId }, data: { status: 'FULL' } });
    } else if (group.status === 'FULL' && approvedCount < group.capacity) {
      await prisma.smallGroup.update({ where: { id: groupId }, data: { status: 'OPEN' } });
    }
  }

  return updated;
}

export async function getTripsForTenant(tenantId: string) {
  const trips = await prisma.trip.findMany({
    where: { tenantId },
    include: {
      members: {
        include: {
          user: { include: { profile: true } },
        },
      },
      itineraryItems: true,
      travelSegments: true,
      donations: true,
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  });

  const enrichedTrips = await Promise.all(
    trips.map(async (trip: any) => {
      const leader = trip.leaderUserId
        ? await prisma.user.findUnique({ where: { id: trip.leaderUserId }, include: { profile: true } })
        : null;
      const coLeader = trip.coLeaderUserId
        ? await prisma.user.findUnique({ where: { id: trip.coLeaderUserId }, include: { profile: true } })
        : null;

      return {
        ...trip,
        leader,
        coLeader,
        members: trip.members.map((m: any) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
          leftAt: m.leftAt,
          waiverAcceptedAt: m.waiverAcceptedAt,
          user: m.user,
        })),
      };
    })
  );

  return enrichedTrips;
}

export async function getTripById(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        include: {
          user: { include: { profile: true } },
        },
      },
      itineraryItems: true,
      travelSegments: true,
      donations: true,
    },
  });

  if (!trip) return null;

  const leader = trip.leaderUserId
    ? await prisma.user.findUnique({ where: { id: trip.leaderUserId }, include: { profile: true } })
    : null;
  const coLeader = trip.coLeaderUserId
    ? await prisma.user.findUnique({ where: { id: trip.coLeaderUserId }, include: { profile: true } })
    : null;

  return {
    ...trip,
    leader,
    coLeader,
    members: trip.members.map((m: any) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      leftAt: m.leftAt,
      waiverAcceptedAt: m.waiverAcceptedAt,
      emergencyContact: m.emergencyContact,
      travelPreferences: m.travelPreferences,
      user: m.user,
    })),
  };
}

export async function createTrip(tenantId: string, tripData: any, createdByUserId?: string) {
  if (!tripData || !tripData.name) {
    throw new Error('Trip must include a name');
  }

  const data: any = {
    tenantId,
    name: tripData.name,
    summary: tripData.summary ?? null,
    description: tripData.description ?? null,
    imageUrl: tripData.imageUrl ?? null,
    leaderUserId: tripData.leaderUserId ?? null,
    coLeaderUserId: tripData.coLeaderUserId ?? null,
    createdByUserId: createdByUserId ?? null,
    startDate: tripData.startDate ? new Date(tripData.startDate) : null,
    endDate: tripData.endDate ? new Date(tripData.endDate) : null,
    departureLocation: tripData.departureLocation ?? null,
    destination: tripData.destination ?? null,
    meetingPoint: tripData.meetingPoint ?? null,
    status: tripData.status ?? undefined,
    joinPolicy: tripData.joinPolicy ?? undefined,
    capacity: tripData.capacity ?? null,
    waitlistEnabled: tripData.waitlistEnabled ?? true,
    costCents: tripData.costCents ?? null,
    currency: tripData.currency ?? 'USD',
    depositCents: tripData.depositCents ?? null,
    allowPartialPayments: tripData.allowPartialPayments ?? false,
    allowScholarships: tripData.allowScholarships ?? false,
    allowMessages: tripData.allowMessages ?? true,
    allowPhotos: tripData.allowPhotos ?? true,
    waiverRequired: tripData.waiverRequired ?? false,
    waiverUrl: tripData.waiverUrl ?? null,
    formUrl: tripData.formUrl ?? null,
    packingList: tripData.packingList ?? null,
    housingDetails: tripData.housingDetails ?? null,
    transportationNotes: tripData.transportationNotes ?? null,
    itineraryJson: tripData.itineraryJson ?? null,
    travelDetails: tripData.travelDetails ?? null,
    safetyNotes: tripData.safetyNotes ?? null,
    fundraisingEnabled: tripData.fundraisingEnabled ?? false,
    fundraisingGoalCents: tripData.fundraisingGoalCents ?? null,
    fundraisingDeadline: tripData.fundraisingDeadline ? new Date(tripData.fundraisingDeadline) : null,
    fundraisingVisibility: tripData.fundraisingVisibility ?? null,
    allowSponsorship: tripData.allowSponsorship ?? false,
    colorHex: tripData.colorHex ?? null,
    isPublic: tripData.isPublic ?? false,
    isHidden: tripData.isHidden ?? false,
  };

  const trip = await prisma.trip.create({ data });

  // Ensure leader membership exists
  if (trip.leaderUserId) {
    try {
      await prisma.tripMember.upsert({
        where: { tripId_userId: { tripId: trip.id, userId: trip.leaderUserId } },
        create: {
          tripId: trip.id,
          userId: trip.leaderUserId,
          role: 'LEADER',
          status: 'APPROVED',
          joinedAt: new Date(),
        },
        update: {
          role: 'LEADER',
          status: 'APPROVED',
        },
      });
    } catch (e) {
      // ignore unique errors
    }
  }

  return trip;
}

export async function joinTrip(tenantId: string, tripId: string, userId: string, intake?: any) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error('Trip not found');
  if (trip.tenantId !== tenantId) throw new Error('Tenant mismatch');

  if (trip.capacity && trip.capacity > 0) {
    const approvedCount = await prisma.tripMember.count({ where: { tripId, status: 'APPROVED' } });
    if (approvedCount >= trip.capacity) {
      if (trip.waitlistEnabled) {
        // allow join as pending waitlist
      } else {
        throw new Error('Trip is full');
      }
    }
  }

  const existing = await prisma.tripMember.findUnique({ where: { tripId_userId: { tripId, userId } } });

  const status = trip.joinPolicy === 'OPEN' ? 'APPROVED' : 'PENDING';

  const emergencyContact = intake?.personalInfo?.emergencyContact
    ? {
        name: intake.personalInfo.emergencyContact.name || null,
        relationship: intake.personalInfo.emergencyContact.relationship || null,
        phone: intake.personalInfo.emergencyContact.phone || null,
        email: intake.personalInfo.emergencyContact.email || null,
      }
    : undefined;

  const intakeEnvelope = intake
    ? {
        personalInfo: intake.personalInfo || {},
        medical: intake.medical || {},
        passport: intake.passport || {},
        guardian: intake.guardian || {},
        waiver: intake.waiver || {},
        agreements: intake.agreements || {},
      }
    : undefined;

  const waiverAcceptedAt = intake?.waiverAccepted ? new Date() : undefined;

  if (existing) {
    const updated = await prisma.tripMember.update({
      where: { id: existing.id },
      data: {
        status,
        emergencyContact: emergencyContact === undefined ? existing.emergencyContact : (emergencyContact as any),
        travelPreferences: intakeEnvelope ? ({ intakeForm: intakeEnvelope } as any) : existing.travelPreferences,
        waiverAcceptedAt: waiverAcceptedAt ?? existing.waiverAcceptedAt ?? (intake ? new Date() : null),
      },
    });
    return updated;
  }

  const membership = await prisma.tripMember.create({
    data: {
      tripId,
      userId,
      role: 'MEMBER',
      status,
      joinedAt: new Date(),
      emergencyContact: emergencyContact === undefined ? undefined : (emergencyContact as any),
      travelPreferences: intakeEnvelope ? ({ intakeForm: intakeEnvelope } as any) : undefined,
      waiverAcceptedAt: waiverAcceptedAt ?? null,
    },
  });

  return membership;
}

export async function approveTripMember(tripId: string, userId: string, approverId?: string) {
  const membership = await prisma.tripMember.findUnique({ where: { tripId_userId: { tripId, userId } } });
  if (!membership) throw new Error('Membership not found');

  const updated = await prisma.tripMember.update({
    where: { id: membership.id },
    data: { status: 'APPROVED', notes: membership.notes },
  });

  return updated;
}

export async function leaveTrip(tripId: string, userId: string) {
  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });

  if (!membership) return null;

  await prisma.tripMember.delete({ where: { id: membership.id } });
  return { success: true };
}

export async function addTripDonation(tripId: string, donationData: any) {
  if (!donationData || typeof donationData.amountCents !== 'number') {
    throw new Error('Donation must include amountCents');
  }

  return prisma.tripDonation.create({
    data: {
      tripId,
      donorUserId: donationData.donorUserId ?? null,
      sponsoredUserId: donationData.sponsoredUserId ?? null,
      amountCents: donationData.amountCents,
      currency: donationData.currency ?? 'USD',
      status: donationData.status ?? 'PLEDGED',
      message: donationData.message ?? null,
      displayName: donationData.displayName ?? null,
      isAnonymous: donationData.isAnonymous ?? false,
      coverFees: donationData.coverFees ?? false,
    },
  });
}

export async function getVolunteerNeedsForTenant(tenantId: string): Promise<VolunteerNeedWithSignups[]> {
  return prisma.volunteerNeed.findMany({
    where: { tenantId },
    include: {
      signups: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });
}

export async function addVolunteerNeed(tenantId: string, needData: any) {
    // TODO: Implement volunteer need creation
    return null;
}

export async function getResourceItemsForTenant(tenantId: string, isMember?: boolean): Promise<EnrichedResourceItem[]> {
    // TODO: Implement resource items fetching
    // isMember parameter to filter based on visibility (members-only vs public)
    return [];
}

export async function addResourceItem(itemData: any) {
    // TODO: Implement resource item creation
    // Expected fields: tenantId, uploaderUserId, title, description, fileUrl, fileType, visibility
    return null;
}

export async function deleteResourceItem(itemId: string, userId?: string) {
    // TODO: Implement resource item deletion
    // userId parameter for audit logging when implemented
    return null;
}

export async function getCommunityPostsForTenant(tenantId: string, includePrivate?: boolean): Promise<CommunityPost[]> {
    const posts = await prisma.communityPost.findMany({
        where: {
            tenantId,
            ...(includePrivate ? {} : { status: CommunityPostStatus.PUBLISHED }),
        },
        orderBy: { createdAt: 'desc' },
    });

    return posts.map((post: any) => ({
        ...post,
        authorDisplayName: post.isAnonymous ? 'Anonymous' : post.authorUserId || 'Unknown',
        authorAvatarUrl: undefined,
        createdAt: new Date(post.createdAt),
    }));
}

export async function updateCommunityPostStatus(postId: string, status: string) {
    return prisma.communityPost.update({
        where: { id: postId },
        data: { status: status as any },
    });
}

export async function getContactSubmissionsForTenant(tenantId: string) {
    const submissions = await prisma.contactSubmission.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
    });

    return submissions.map((submission) => ({
        ...submission,
        createdAt: new Date(submission.createdAt),
    }));
}

export async function updateContactSubmissionStatus(submissionId: string, status: string, userId?: string) {
    return prisma.contactSubmission.update({
        where: { id: submissionId },
        data: { status: status as any },
    });
}

export async function respondToContactSubmission(submissionId: string, response: string, userId?: string, tenantName?: string) {
    await prisma.contactSubmission.update({
        where: { id: submissionId },
        data: { status: ContactSubmissionStatus.READ },
    });

    console.info(`Response recorded for submission ${submissionId}${tenantName ? ` from ${tenantName}` : ''}: ${response}`);
}

export async function updateTenantPermissions(tenantId: string, permissions: any, userId?: string) {
    // TODO: Implement tenant permissions update
    // userId parameter for audit logging when implemented
    return null;
}

export async function addPost(tenantId: string, postData: any) {
    // TODO: Implement post creation
    return null;
}

export async function addEvent(eventData: any) {
    // TODO: Implement event creation
    // Expected fields: tenantId, createdByUserId, title, description, startDateTime, endDateTime, location, onlineUrl
    return null;
}

export async function getSermonsForTenant(tenantId: string) {
    const sermons = await prisma.mediaItem.findMany({
        where: { 
            tenantId, 
            type: 'SERMON_VIDEO',
            deletedAt: null,
        },
        orderBy: { publishedAt: 'desc' },
        include: {
            author: {
                include: {
                    profile: true,
                }
            }
        }
    });
    
    return sermons.map((sermon: any) => ({
        ...sermon,
        authorDisplayName: sermon.author.profile?.displayName || 'Unknown',
        authorAvatarUrl: sermon.author.profile?.avatarUrl || undefined,
    }));
}

export async function getPodcastsForTenant(tenantId: string) {
    const podcasts = await prisma.mediaItem.findMany({
        where: { 
            tenantId, 
            type: 'PODCAST_AUDIO',
            deletedAt: null,
        },
        orderBy: { publishedAt: 'desc' },
        include: {
            author: {
                include: {
                    profile: true,
                }
            }
        }
    });
    
    return podcasts.map((podcast: any) => ({
        ...podcast,
        authorDisplayName: podcast.author.profile?.displayName || 'Unknown',
        authorAvatarUrl: podcast.author.profile?.avatarUrl || undefined,
    }));
}

export async function getPhotosForTenant(tenantId: string) {
  const photos = await prisma.mediaItem.findMany({
    where: {
      tenantId,
      type: 'PHOTO',
      deletedAt: null,
    },
    orderBy: { uploadedAt: 'desc' },
    include: {
      author: {
        include: {
          profile: true,
        }
      }
    }
  });

  return photos.map((photo: any) => ({
    ...photo,
    authorDisplayName: photo.author?.profile?.displayName || 'Unknown',
    authorAvatarUrl: photo.author?.profile?.avatarUrl || undefined,
  }));
}

export async function getBooksForTenant(tenantId: string) {
    const books = await prisma.post.findMany({
        where: { 
            tenantId, 
            type: 'BOOK',
            isPublished: true,
        },
        orderBy: { publishedAt: 'desc' },
        include: {
            author: {
                include: {
                    profile: true,
                }
            }
        }
    });
    
    return books.map((book: any) => ({
        ...book,
        type: book.type as 'BLOG' | 'ANNOUNCEMENT' | 'BOOK',
        authorDisplayName: book.author.profile?.displayName || 'Unknown',
        authorAvatarUrl: book.author.profile?.avatarUrl || undefined,
    }));
}

export type DonationRecordInput = Omit<DonationRecord, 'tenantId' | 'donatedAt' | 'id'> & {
    userAvatarUrl?: string;
};

export async function getDonationsForTenant(tenantId: string): Promise<EnrichedDonationRecord[]> {
    // TODO: Implement donations fetching
    return [];
}

export async function addDonationRecord(
    tenantId: string,
    donationData: DonationRecordInput,
): Promise<EnrichedDonationRecord | null> {
    // TODO: Implement donation record creation
    return null;
}

export async function addContactSubmission(tenantId: string, submissionData: any) {
    const submission = await prisma.contactSubmission.create({
        data: {
            tenantId,
            name: submissionData.name,
            email: submissionData.email,
            message: submissionData.message,
            status: ContactSubmissionStatus.UNREAD,
        },
    });

    return submission;
}

export async function addCommunityPost(postData: any) {
    // TODO: Implement community post creation
    // Expected fields: tenantId, authorUserId (can be null for anonymous), type, body, isAnonymous
    return null;
}
export async function leaveSmallGroup(groupId: string, userId: string) {
    const membership = await prisma.smallGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!membership) return null;

    await prisma.smallGroupMembership.delete({ where: { id: membership.id } });
    return { success: true };
}

export async function signUpForNeed(needId: string, userId: string) {
    // TODO: Implement volunteer need sign up
    return null;
}

export async function cancelSignUp(needId: string, userId: string) {
    // TODO: Implement volunteer need cancellation
    return null;
}

export async function createConversation(conversationData: any) {
    // TODO: Implement conversation creation
    return null;
}

export async function adminUpdateUserProfile(userId: string, profileData: any) {
    // TODO: Implement admin user profile update
    return null;
}
