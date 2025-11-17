import { prisma } from './db';
import { Tenant, User, Post, Event, UserTenantMembership, Notification, AuditLog, Conversation, TenantRole, MembershipStatus, TenantSettings, TenantBranding } from '@prisma/client';
import bcrypt from 'bcryptjs';

type TenantWithDetails = Tenant & {
    settings: TenantSettings | null;
    branding: TenantBranding | null;
};

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

export async function getTenantById(tenantId: string) {
  return await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      branding: true,
    },
  });
}

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

export async function getTenants(): Promise<Tenant[]> {
    const tenants = await prisma.tenant.findMany({
        include: {
            settings: true,
            branding: true,
        }
    });
    
    // Transform Prisma data to match Tenant interface with nested address
    return tenants.map(tenant => ({
        ...tenant,
        address: {
            street: tenant.street,
            city: tenant.city,
            state: tenant.state,
            country: tenant.country,
            postalCode: tenant.postalCode,
        },
        settings: tenant.settings || {
            isPublic: true,
            allowMemberDirectory: true,
            allowEvents: true,
            allowDonations: true,
            allowSmallGroups: true,
            allowMessaging: true,
        },
        branding: tenant.branding || {
            logoUrl: '',
            bannerImageUrl: '',
            primaryColor: '#d97706',
            accentColor: '#92400e',
        },
        permissions: tenant.permissions as any || {},
    })) as Tenant[];
}

export async function getEventsForTenant(tenantId: string) {
  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDateTime: 'asc' },
    include: {
      createdBy: {
        include: {
          profile: true,
        }
      }
    }
  });
  
  return events.map(event => ({
    ...event,
    onlineUrl: event.onlineUrl || undefined,
    creatorDisplayName: event.createdBy.profile?.displayName || event.createdBy.email,
    creatorAvatarUrl: event.createdBy.profile?.avatarUrl || undefined,
  }));
}

export async function getPostsForTenant(tenantId: string): Promise<Post[]> {
  return await prisma.post.findMany({
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
}

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

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
}

export async function markAllNotificationsAsRead(userId: string) {
    return await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
    });
}

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

export async function createTenant(tenantDetails: Omit<Tenant, 'id' | 'slug' | 'permissions'>, ownerId: string): Promise<Tenant> {
    const tenant = await prisma.tenant.create({
        data: {
            ...tenantDetails,
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

export async function updateTenant(tenant: Partial<TenantWithDetails>): Promise<Tenant> {
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
            ...event,
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
    
    return memberships.map(m => ({
        membership: m,
        tenant: m.tenant
    }));
}

// Update membership profile (display name and title within a tenant)
export async function updateMembershipProfile(
    userId: string, 
    membershipId: string, 
    data: { displayName?: string; displayTitle?: string }
) {
    return await prisma.userTenantMembership.update({
        where: { id: membershipId, userId },
        data: {
            displayName: data.displayName,
            displayTitle: data.displayTitle
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
    // TODO: Implement member fetching with enriched data
    return [];
}

export async function updateMembershipStatus(userId: string, tenantId: string, status: string) {
    // TODO: Implement membership status update
    return null;
}

export async function updateMemberRolesAndTitle(userId: string, tenantId: string, roles: any[], title: string) {
    // TODO: Implement member roles and title update
    return null;
}

export async function getSmallGroupsForTenant(tenantId: string) {
    // TODO: Implement small groups fetching
    return [];
}

export async function createSmallGroup(tenantId: string, groupData: any) {
    // TODO: Implement small group creation
    return null;
}

export async function getVolunteerNeedsForTenant(tenantId: string) {
    // TODO: Implement volunteer needs fetching
    return [];
}

export async function addVolunteerNeed(tenantId: string, needData: any) {
    // TODO: Implement volunteer need creation
    return null;
}

export async function getResourceItemsForTenant(tenantId: string) {
    // TODO: Implement resource items fetching
    return [];
}

export async function addResourceItem(tenantId: string, itemData: any) {
    // TODO: Implement resource item creation
    return null;
}

export async function deleteResourceItem(itemId: string) {
    // TODO: Implement resource item deletion
    return null;
}

export async function getCommunityPostsForTenant(tenantId: string) {
    // TODO: Implement community posts fetching
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

export async function updateContactSubmissionStatus(submissionId: string, status: string) {
    // TODO: Implement contact submission status update
    return null;
}

export async function respondToContactSubmission(submissionId: string, response: string) {
    // TODO: Implement contact submission response
    return null;
}

export async function updateTenantPermissions(tenantId: string, permissions: any) {
    // TODO: Implement tenant permissions update
    return null;
}

export async function addPost(tenantId: string, postData: any) {
    // TODO: Implement post creation
    return null;
}

export async function addEvent(tenantId: string, eventData: any) {
    // TODO: Implement event creation
    return null;
}

export async function getSermonsForTenant(tenantId: string) {
    // TODO: Implement sermons fetching
    return [];
}

export async function getPodcastsForTenant(tenantId: string) {
    // TODO: Implement podcasts fetching
    return [];
}

export async function getBooksForTenant(tenantId: string) {
    // TODO: Implement books fetching
    return [];
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

export async function addCommunityPost(tenantId: string, postData: any) {
    // TODO: Implement community post creation
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
