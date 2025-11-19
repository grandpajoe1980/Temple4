import { prisma } from './db';
import { Tenant, User, Post, Event, UserTenantMembership, Notification, AuditLog, Conversation, TenantSettings as PrismaTenantSettings, TenantBranding as PrismaTenantBranding, CommunityPost as PrismaCommunityPost, ServiceOffering as PrismaServiceOffering, ServiceCategory } from '@prisma/client';
import { TenantRole, MembershipStatus, TenantSettings, TenantBranding, CommunityPost } from '@/types';
import { EnrichedResourceItem } from '@/types';
import bcrypt from 'bcryptjs';

type TenantWithRelations = Tenant & {
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

/**
 * Get all tenants that a user is an approved member of
 * @param userId - The ID of the user
 * @returns Array of tenants where the user has APPROVED membership status
 */
export async function getTenantsForUser(userId: string): Promise<Tenant[]> {
  const memberships = await prisma.userTenantMembership.findMany({
    where: {
      userId: userId,
      status: 'APPROVED',
    },
    include: {
      tenant: true,
    },
  });

  return memberships.map((membership: { tenant: Tenant; }) => membership.tenant);
}

/**
 * Get a tenant by ID with its settings, branding, and address information
 * @param tenantId - The ID of the tenant to retrieve
 * @returns Tenant with settings, branding, and address, or null if not found
 */
export async function getTenantById(tenantId: string) {
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
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      privacySettings: true,
      accountSettings: true,
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

/**
 * Get all events for a specific tenant, ordered by start date
 * Includes creator information with display name and avatar
 * @param tenantId - The ID of the tenant
 * @returns Array of events with enriched creator information
 */
export async function getEventsForTenant(tenantId: string) {
  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDateTime: 'asc' },
    include: {
      creator: {
        include: {
          profile: true,
        }
      }
    }
  });
  
  return events.map((event: any) => ({
    ...event,
    onlineUrl: event.onlineUrl,
    creatorDisplayName: event.creator.profile?.displayName || event.creator.email,
    creatorAvatarUrl: event.creator.profile?.avatarUrl || null,
  }));
}

/**
 * Get all published posts for a specific tenant, ordered by publish date (newest first)
 * Only returns posts where isPublished is true
 * @param tenantId - The ID of the tenant
 * @returns Array of published posts with author information
 */
export async function getPostsForTenant(tenantId: string) {
  const posts = await prisma.post.findMany({
    where: { tenantId, isPublished: true },
    orderBy: { publishedAt: 'desc' },
    include: {
      author: {
        include: {
          profile: true,
        }
      }
    }
  });
  
  return posts.map((post: any) => ({
    ...post,
    type: post.type as 'BLOG' | 'ANNOUNCEMENT' | 'BOOK',
    authorDisplayName: post.author.profile?.displayName || 'Unknown',
    authorAvatarUrl: post.author.profile?.avatarUrl || undefined,
  }));
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
                    enableBooks: true,
                    enableDonations: true,
                    enableVolunteering: true,
                    enableSmallGroups: true,
                    enableLiveStream: true,
                    enablePrayerWall: true,
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

    return await prisma.conversation.create({
        data: {
            isDirectMessage: true,
            participants: {
                create: [
                    { userId: userId1 },
                    { userId: userId2 },
                ]
            }
        }
    });
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

export async function getMessagesForConversation(conversationId: string) {
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

export async function addMessage(conversationId: string, senderId: string, content: string) {
    const message = await prisma.chatMessage.create({
        data: {
            conversationId,
            userId: senderId,
            text: content
        },
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    });

    return message;
}

export async function deleteMessage(messageId: string) {
    return await prisma.chatMessage.delete({
        where: { id: messageId }
    });
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

export async function getMembersForTenant(tenantId: string) {
    const memberships = await prisma.userTenantMembership.findMany({
        where: { tenantId },
        include: {
            user: {
                include: {
                    profile: true,
                }
            },
            roles: true,
        },
        orderBy: [
            { user: { profile: { displayName: 'asc' } } }
        ]
    });
    
    return memberships.map((membership: any) => ({
        ...membership.user,
        membership: {
            id: membership.id,
            status: membership.status,
            displayName: membership.displayName,
            roles: membership.roles,
        }
    }));
}

export async function updateMembershipStatus(userId: string, tenantId: string, status: string) {
    // TODO: Implement membership status update
    return null;
}

export async function updateMemberRolesAndTitle(membershipId: string, roles: any[], userId?: string) {
    // TODO: Implement member roles and title update
    // membershipId: UserTenantMembership.id
    // roles: array of UserTenantRole
    // userId: for audit logging when implemented
    return null;
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
        const leader = await prisma.user.findUnique({
            where: { id: group.leaderUserId },
            include: {
                profile: true,
                privacySettings: true,
                accountSettings: true,
            }
        });
        
        return {
            ...group,
            leader: leader!,
            members: group.members.map((m: any) => ({
                ...m.user,
                groupRole: m.role,
                joinedAt: m.joinedAt,
            }))
        };
    }));
    
    return enrichedGroups;
}

export async function createSmallGroup(tenantId: string, groupData: any) {
    // TODO: Implement small group creation
    return null;
}

export async function getVolunteerNeedsForTenant(tenantId: string) {
    return await prisma.volunteerNeed.findMany({
        where: { tenantId },
        include: {
            signups: {
                include: {
                    user: {
                        include: {
                            profile: true,
                        }
                    }
                }
            }
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
    // TODO: Implement community posts fetching
    // includePrivate parameter to filter based on status (for moderation)
    return [];
}

export async function updateCommunityPostStatus(postId: string, status: string) {
    // TODO: Implement community post status update
    return null;
}

export async function getContactSubmissionsForTenant(tenantId: string) {
    // TODO: Implement contact submissions fetching
    return [];
}

export async function updateContactSubmissionStatus(submissionId: string, status: string, userId?: string) {
    // TODO: Implement contact submission status update
    // userId parameter for audit logging when implemented
    return null;
}

export async function respondToContactSubmission(submissionId: string, response: string, userId?: string, tenantName?: string) {
    // TODO: Implement contact submission response
    // userId and tenantName parameters for sending response email when implemented
    return null;
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

export async function getDonationsForTenant(tenantId: string) {
    // TODO: Implement donations fetching
    return [];
}

export async function addDonationRecord(tenantId: string, donationData: any) {
    // TODO: Implement donation record creation
    return null;
}

export async function addContactSubmission(tenantId: string, submissionData: any) {
    // TODO: Implement contact submission creation
    return null;
}

export async function addCommunityPost(postData: any) {
    // TODO: Implement community post creation
    // Expected fields: tenantId, authorUserId (can be null for anonymous), type, body, isAnonymous
    return null;
}

export async function joinSmallGroup(groupId: string, userId: string) {
    // TODO: Implement small group join
    return null;
}

export async function leaveSmallGroup(groupId: string, userId: string) {
    // TODO: Implement small group leave
    return null;
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
