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
    return await prisma.tenant.findMany({
        include: {
            settings: true,
            branding: true,
        }
    });
}

export async function getEventsForTenant(tenantId: string): Promise<Event[]> {
  return await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDateTime: 'asc' },
  });
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
            status: MembershipStatus.REQUESTED,
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
            isDirect: true,
            isPrivateGroup: false,
            createdByUserId: userId1,
            participants: {
                create: [
                    { userId: userId1 },
                    { userId: userId2 },
                ]
            }
        }
    });
}


