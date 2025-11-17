module.exports = [
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// --- ENUMS ---
__turbopack_context__.s([
    "ActionType",
    ()=>ActionType,
    "CommunityPostStatus",
    ()=>CommunityPostStatus,
    "CommunityPostType",
    ()=>CommunityPostType,
    "ContactSubmissionStatus",
    ()=>ContactSubmissionStatus,
    "FileType",
    ()=>FileType,
    "MembershipApprovalMode",
    ()=>MembershipApprovalMode,
    "MembershipStatus",
    ()=>MembershipStatus,
    "ResourceVisibility",
    ()=>ResourceVisibility,
    "SmallGroupRole",
    ()=>SmallGroupRole,
    "TenantRole",
    ()=>TenantRole,
    "TenantRoleType",
    ()=>TenantRoleType,
    "VolunteerStatus",
    ()=>VolunteerStatus
]);
var TenantRole = /*#__PURE__*/ function(TenantRole) {
    TenantRole["MEMBER"] = "MEMBER";
    TenantRole["STAFF"] = "STAFF";
    TenantRole["CLERGY"] = "CLERGY";
    TenantRole["MODERATOR"] = "MODERATOR";
    TenantRole["ADMIN"] = "ADMIN";
    return TenantRole;
}({});
var TenantRoleType = /*#__PURE__*/ function(TenantRoleType) {
    TenantRoleType["MEMBER"] = "MEMBER";
    TenantRoleType["STAFF"] = "STAFF";
    TenantRoleType["MODERATOR"] = "MODERATOR";
    return TenantRoleType;
}({});
var MembershipStatus = /*#__PURE__*/ function(MembershipStatus) {
    MembershipStatus["REQUESTED"] = "REQUESTED";
    MembershipStatus["APPROVED"] = "APPROVED";
    MembershipStatus["REJECTED"] = "REJECTED";
    MembershipStatus["BANNED"] = "BANNED";
    return MembershipStatus;
}({});
var MembershipApprovalMode = /*#__PURE__*/ function(MembershipApprovalMode) {
    MembershipApprovalMode["OPEN"] = "OPEN";
    MembershipApprovalMode["APPROVAL_REQUIRED"] = "APPROVAL_REQUIRED";
    return MembershipApprovalMode;
}({});
var VolunteerStatus = /*#__PURE__*/ function(VolunteerStatus) {
    VolunteerStatus["CONFIRMED"] = "CONFIRMED";
    VolunteerStatus["CANCELED"] = "CANCELED";
    return VolunteerStatus;
}({});
var SmallGroupRole = /*#__PURE__*/ function(SmallGroupRole) {
    SmallGroupRole["LEADER"] = "LEADER";
    SmallGroupRole["MEMBER"] = "MEMBER";
    return SmallGroupRole;
}({});
var CommunityPostType = /*#__PURE__*/ function(CommunityPostType) {
    CommunityPostType["PRAYER_REQUEST"] = "PRAYER_REQUEST";
    CommunityPostType["TANGIBLE_NEED"] = "TANGIBLE_NEED";
    return CommunityPostType;
}({});
var CommunityPostStatus = /*#__PURE__*/ function(CommunityPostStatus) {
    CommunityPostStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    CommunityPostStatus["PUBLISHED"] = "PUBLISHED";
    CommunityPostStatus["FULFILLED"] = "FULFILLED";
    return CommunityPostStatus;
}({});
var ResourceVisibility = /*#__PURE__*/ function(ResourceVisibility) {
    ResourceVisibility["PUBLIC"] = "PUBLIC";
    ResourceVisibility["MEMBERS_ONLY"] = "MEMBERS_ONLY";
    return ResourceVisibility;
}({});
var FileType = /*#__PURE__*/ function(FileType) {
    FileType["PDF"] = "PDF";
    FileType["DOCX"] = "DOCX";
    FileType["MP3"] = "MP3";
    FileType["JPG"] = "JPG";
    FileType["PNG"] = "PNG";
    FileType["OTHER"] = "OTHER";
    return FileType;
}({});
var ContactSubmissionStatus = /*#__PURE__*/ function(ContactSubmissionStatus) {
    ContactSubmissionStatus["UNREAD"] = "UNREAD";
    ContactSubmissionStatus["READ"] = "READ";
    ContactSubmissionStatus["ARCHIVED"] = "ARCHIVED";
    return ContactSubmissionStatus;
}({});
var ActionType = /*#__PURE__*/ function(ActionType) {
    ActionType["IMPERSONATE_START"] = "IMPERSONATE_START";
    ActionType["IMPERSONATE_END"] = "IMPERSONATE_END";
    ActionType["CREATE_POST"] = "CREATE_POST";
    ActionType["DELETE_POST"] = "DELETE_POST";
    ActionType["BAN_USER"] = "BAN_USER";
    ActionType["UNBAN_USER"] = "UNBAN_USER";
    ActionType["DELETE_MESSAGE"] = "DELETE_MESSAGE";
    ActionType["USER_JOINED_TENANT"] = "USER_JOINED_TENANT";
    ActionType["MEMBERSHIP_STATUS_UPDATED"] = "MEMBERSHIP_STATUS_UPDATED";
    ActionType["MEMBER_ROLES_UPDATED"] = "MEMBER_ROLES_UPDATED";
    ActionType["MEMBERSHIP_PROFILE_UPDATED"] = "MEMBERSHIP_PROFILE_UPDATED";
    ActionType["USER_REGISTERED"] = "USER_REGISTERED";
    ActionType["USER_PROFILE_UPDATED"] = "USER_PROFILE_UPDATED";
    ActionType["ADMIN_UPDATED_USER_PROFILE"] = "ADMIN_UPDATED_USER_PROFILE";
    ActionType["TENANT_PERMISSIONS_UPDATED"] = "TENANT_PERMISSIONS_UPDATED";
    return ActionType;
}({});
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const prisma = globalThis.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalThis.prisma = prisma;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCommunityPost",
    ()=>addCommunityPost,
    "addContactSubmission",
    ()=>addContactSubmission,
    "addDonationRecord",
    ()=>addDonationRecord,
    "addEvent",
    ()=>addEvent,
    "addMessage",
    ()=>addMessage,
    "addPost",
    ()=>addPost,
    "addResourceItem",
    ()=>addResourceItem,
    "addVolunteerNeed",
    ()=>addVolunteerNeed,
    "adminUpdateUserProfile",
    ()=>adminUpdateUserProfile,
    "cancelSignUp",
    ()=>cancelSignUp,
    "createConversation",
    ()=>createConversation,
    "createSmallGroup",
    ()=>createSmallGroup,
    "createTenant",
    ()=>createTenant,
    "deleteMessage",
    ()=>deleteMessage,
    "deleteResourceItem",
    ()=>deleteResourceItem,
    "getAllUsers",
    ()=>getAllUsers,
    "getAuditLogs",
    ()=>getAuditLogs,
    "getBooksForTenant",
    ()=>getBooksForTenant,
    "getCommunityPostsForTenant",
    ()=>getCommunityPostsForTenant,
    "getContactSubmissionsForTenant",
    ()=>getContactSubmissionsForTenant,
    "getConversationsForUser",
    ()=>getConversationsForUser,
    "getDonationsForTenant",
    ()=>getDonationsForTenant,
    "getEnrichedMembershipsForUser",
    ()=>getEnrichedMembershipsForUser,
    "getEventsForTenant",
    ()=>getEventsForTenant,
    "getMembersForTenant",
    ()=>getMembersForTenant,
    "getMembershipForUserInTenant",
    ()=>getMembershipForUserInTenant,
    "getMessagesForConversation",
    ()=>getMessagesForConversation,
    "getNotificationsForUser",
    ()=>getNotificationsForUser,
    "getOrCreateDirectConversation",
    ()=>getOrCreateDirectConversation,
    "getPodcastsForTenant",
    ()=>getPodcastsForTenant,
    "getPostsForTenant",
    ()=>getPostsForTenant,
    "getResourceItemsForTenant",
    ()=>getResourceItemsForTenant,
    "getSermonsForTenant",
    ()=>getSermonsForTenant,
    "getSmallGroupsForTenant",
    ()=>getSmallGroupsForTenant,
    "getTenantById",
    ()=>getTenantById,
    "getTenants",
    ()=>getTenants,
    "getTenantsForUser",
    ()=>getTenantsForUser,
    "getUserByEmail",
    ()=>getUserByEmail,
    "getUserById",
    ()=>getUserById,
    "getVolunteerNeedsForTenant",
    ()=>getVolunteerNeedsForTenant,
    "joinSmallGroup",
    ()=>joinSmallGroup,
    "leaveSmallGroup",
    ()=>leaveSmallGroup,
    "logAuditEvent",
    ()=>logAuditEvent,
    "markAllNotificationsAsRead",
    ()=>markAllNotificationsAsRead,
    "markConversationAsRead",
    ()=>markConversationAsRead,
    "markNotificationAsRead",
    ()=>markNotificationAsRead,
    "registerUser",
    ()=>registerUser,
    "requestPasswordReset",
    ()=>requestPasswordReset,
    "requestToJoinTenant",
    ()=>requestToJoinTenant,
    "resetPassword",
    ()=>resetPassword,
    "respondToContactSubmission",
    ()=>respondToContactSubmission,
    "signUpForNeed",
    ()=>signUpForNeed,
    "updateCommunityPostStatus",
    ()=>updateCommunityPostStatus,
    "updateContactSubmissionStatus",
    ()=>updateContactSubmissionStatus,
    "updateMemberRolesAndTitle",
    ()=>updateMemberRolesAndTitle,
    "updateMembershipProfile",
    ()=>updateMembershipProfile,
    "updateMembershipStatus",
    ()=>updateMembershipStatus,
    "updateTenant",
    ()=>updateTenant,
    "updateTenantPermissions",
    ()=>updateTenantPermissions,
    "updateUserNotificationPreferences",
    ()=>updateUserNotificationPreferences
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-ssr] (ecmascript)");
;
;
;
async function getTenantsForUser(userId) {
    const memberships = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findMany({
        where: {
            userId: userId,
            status: 'APPROVED'
        },
        include: {
            tenant: true
        }
    });
    return memberships.map((membership)=>membership.tenant);
}
async function getTenantById(tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            id: tenantId
        },
        include: {
            settings: true,
            branding: true
        }
    });
}
async function getUserById(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        include: {
            profile: true,
            privacySettings: true,
            accountSettings: true
        }
    });
}
async function getTenants() {
    const tenants = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].tenant.findMany({
        include: {
            settings: true,
            branding: true
        }
    });
    // Transform Prisma data to match Tenant interface with nested address
    return tenants.map((tenant)=>({
            ...tenant,
            address: {
                street: tenant.street,
                city: tenant.city,
                state: tenant.state,
                country: tenant.country,
                postalCode: tenant.postalCode
            },
            settings: tenant.settings || {
                isPublic: true,
                allowMemberDirectory: true,
                allowEvents: true,
                allowDonations: true,
                allowSmallGroups: true,
                allowMessaging: true
            },
            branding: tenant.branding || {
                logoUrl: '',
                bannerImageUrl: '',
                primaryColor: '#d97706',
                accentColor: '#92400e'
            },
            permissions: tenant.permissions || {}
        }));
}
async function getEventsForTenant(tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].event.findMany({
        where: {
            tenantId
        },
        orderBy: {
            startDateTime: 'asc'
        }
    });
}
async function getPostsForTenant(tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].post.findMany({
        where: {
            tenantId,
            isPublished: true
        },
        orderBy: {
            publishedAt: 'desc'
        },
        include: {
            author: {
                include: {
                    profile: true
                }
            }
        }
    });
}
async function getMembershipForUserInTenant(userId, tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId
            }
        }
    });
}
async function getNotificationsForUser(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].notification.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}
async function markNotificationAsRead(notificationId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].notification.update({
        where: {
            id: notificationId
        },
        data: {
            isRead: true
        }
    });
}
async function markAllNotificationsAsRead(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].notification.updateMany({
        where: {
            userId
        },
        data: {
            isRead: true
        }
    });
}
async function getUserByEmail(email) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            email
        },
        include: {
            profile: true,
            privacySettings: true,
            accountSettings: true
        }
    });
}
async function registerUser(displayName, email, pass) {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return {
            success: false,
            message: 'User with this email already exists.'
        };
    }
    const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].hash(pass, 10);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.create({
        data: {
            email,
            password: hashedPassword,
            profile: {
                create: {
                    displayName
                }
            },
            accountSettings: {
                create: {}
            },
            privacySettings: {
                create: {}
            }
        },
        include: {
            profile: true,
            privacySettings: true,
            accountSettings: true
        }
    });
    return {
        success: true,
        user
    };
}
async function createTenant(tenantDetails, ownerId) {
    const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].tenant.create({
        data: {
            ...tenantDetails,
            slug: tenantDetails.name.toLowerCase().replace(/ /g, '-'),
            memberships: {
                create: {
                    userId: ownerId,
                    roles: {
                        create: {
                            role: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].ADMIN
                        }
                    },
                    status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["MembershipStatus"].APPROVED
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
                    liveStreamSettings: {}
                }
            },
            branding: {
                create: {
                    logoUrl: '',
                    bannerImageUrl: '',
                    primaryColor: '#000000',
                    accentColor: '#FFFFFF',
                    customLinks: []
                }
            }
        }
    });
    return tenant;
}
async function updateTenant(tenant) {
    const { id, settings, branding, ...data } = tenant;
    const updateData = {
        ...data
    };
    if (settings) {
        const { id: settingsId, tenantId: settingsTenantId, ...restOfSettings } = settings;
        updateData.settings = {
            update: {
                ...restOfSettings,
                visitorVisibility: restOfSettings.visitorVisibility || undefined,
                donationSettings: restOfSettings.donationSettings || undefined,
                liveStreamSettings: restOfSettings.liveStreamSettings || undefined
            }
        };
    }
    if (branding) {
        const { id: brandingId, tenantId: brandingTenantId, ...restOfBranding } = branding;
        updateData.branding = {
            update: {
                ...restOfBranding,
                customLinks: restOfBranding.customLinks || undefined
            }
        };
    }
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].tenant.update({
        where: {
            id
        },
        data: updateData
    });
}
async function requestToJoinTenant(userId, tenantId) {
    const existingMembership = await getMembershipForUserInTenant(userId, tenantId);
    if (existingMembership) {
        return existingMembership;
    }
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.create({
        data: {
            userId,
            tenantId,
            roles: {
                create: {
                    role: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].MEMBER
                }
            },
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["MembershipStatus"].PENDING
        }
    });
}
async function requestPasswordReset(email) {
    const user = await getUserByEmail(email);
    if (!user) return false;
    // In a real app, generate a token, save it, and email a link.
    console.log(`Password reset requested for ${email}. In this demo, we'll just allow a direct reset.`);
    return true;
}
async function resetPassword(email, newPass) {
    const user = await getUserByEmail(email);
    if (!user) return {
        success: false,
        message: "User not found."
    };
    const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].hash(newPass, 10);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.update({
        where: {
            email
        },
        data: {
            password: hashedPassword
        }
    });
    return {
        success: true
    };
}
async function logAuditEvent(event) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].auditLog.create({
        data: {
            ...event,
            metadata: event.metadata || {}
        }
    });
}
async function getOrCreateDirectConversation(userId1, userId2) {
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].conversation.findFirst({
        where: {
            isDirectMessage: true,
            participants: {
                every: {
                    userId: {
                        in: [
                            userId1,
                            userId2
                        ]
                    }
                }
            }
        },
        include: {
            participants: true
        }
    });
    if (existing) return existing;
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].conversation.create({
        data: {
            isDirectMessage: true,
            participants: {
                create: [
                    {
                        userId: userId1
                    },
                    {
                        userId: userId2
                    }
                ]
            }
        }
    });
}
async function getConversationsForUser(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].conversation.findMany({
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
async function getMessagesForConversation(conversationId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].chatMessage.findMany({
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
async function addMessage(conversationId, senderId, content) {
    const message = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].chatMessage.create({
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
async function deleteMessage(messageId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].chatMessage.delete({
        where: {
            id: messageId
        }
    });
}
async function markConversationAsRead(conversationId, userId) {
    // This would update read receipts via ConversationParticipant's lastReadMessageId
    // For now, just return success
    return {
        success: true
    };
}
async function getAllUsers() {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.findMany({
        include: {
            profile: true
        }
    });
}
async function getAuditLogs() {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].auditLog.findMany({
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
async function getEnrichedMembershipsForUser(userId) {
    const memberships = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findMany({
        where: {
            userId
        },
        include: {
            tenant: {
                include: {
                    settings: true,
                    branding: true
                }
            }
        }
    });
    return memberships.map((m)=>({
            membership: m,
            tenant: m.tenant
        }));
}
async function updateMembershipProfile(userId, membershipId, data) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.update({
        where: {
            id: membershipId,
            userId
        },
        data: {
            displayName: data.displayName,
            displayTitle: data.displayTitle
        }
    });
}
async function updateUserNotificationPreferences(userId, preferences) {
    // Note: This assumes notification preferences are stored in a JSON field or separate table
    // Adjust based on your actual schema
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prisma"].user.update({
        where: {
            id: userId
        },
        data: {
        }
    });
}
async function getMembersForTenant(tenantId) {
    // TODO: Implement member fetching with enriched data
    return [];
}
async function updateMembershipStatus(userId, tenantId, status) {
    // TODO: Implement membership status update
    return null;
}
async function updateMemberRolesAndTitle(userId, tenantId, roles, title) {
    // TODO: Implement member roles and title update
    return null;
}
async function getSmallGroupsForTenant(tenantId) {
    // TODO: Implement small groups fetching
    return [];
}
async function createSmallGroup(tenantId, groupData) {
    // TODO: Implement small group creation
    return null;
}
async function getVolunteerNeedsForTenant(tenantId) {
    // TODO: Implement volunteer needs fetching
    return [];
}
async function addVolunteerNeed(tenantId, needData) {
    // TODO: Implement volunteer need creation
    return null;
}
async function getResourceItemsForTenant(tenantId) {
    // TODO: Implement resource items fetching
    return [];
}
async function addResourceItem(tenantId, itemData) {
    // TODO: Implement resource item creation
    return null;
}
async function deleteResourceItem(itemId) {
    // TODO: Implement resource item deletion
    return null;
}
async function getCommunityPostsForTenant(tenantId) {
    // TODO: Implement community posts fetching
    return [];
}
async function updateCommunityPostStatus(postId, status) {
    // TODO: Implement community post status update
    return null;
}
async function getContactSubmissionsForTenant(tenantId) {
    // TODO: Implement contact submissions fetching
    return [];
}
async function updateContactSubmissionStatus(submissionId, status) {
    // TODO: Implement contact submission status update
    return null;
}
async function respondToContactSubmission(submissionId, response) {
    // TODO: Implement contact submission response
    return null;
}
async function updateTenantPermissions(tenantId, permissions) {
    // TODO: Implement tenant permissions update
    return null;
}
async function addPost(tenantId, postData) {
    // TODO: Implement post creation
    return null;
}
async function addEvent(tenantId, eventData) {
    // TODO: Implement event creation
    return null;
}
async function getSermonsForTenant(tenantId) {
    // TODO: Implement sermons fetching
    return [];
}
async function getPodcastsForTenant(tenantId) {
    // TODO: Implement podcasts fetching
    return [];
}
async function getBooksForTenant(tenantId) {
    // TODO: Implement books fetching
    return [];
}
async function getDonationsForTenant(tenantId) {
    // TODO: Implement donations fetching
    return [];
}
async function addDonationRecord(tenantId, donationData) {
    // TODO: Implement donation record creation
    return null;
}
async function addContactSubmission(tenantId, submissionData) {
    // TODO: Implement contact submission creation
    return null;
}
async function addCommunityPost(tenantId, postData) {
    // TODO: Implement community post creation
    return null;
}
async function joinSmallGroup(groupId, userId) {
    // TODO: Implement small group join
    return null;
}
async function leaveSmallGroup(groupId, userId) {
    // TODO: Implement small group leave
    return null;
}
async function signUpForNeed(needId, userId) {
    // TODO: Implement volunteer need sign up
    return null;
}
async function cancelSignUp(needId, userId) {
    // TODO: Implement volunteer need cancellation
    return null;
}
async function createConversation(conversationData) {
    // TODO: Implement conversation creation
    return null;
}
async function adminUpdateUserProfile(userId, profileData) {
    // TODO: Implement admin user profile update
    return null;
}
}),
"[project]/app/components/ui/Button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const Button = ({ children, variant = 'primary', size = 'md', className, ...props })=>{
    const baseClasses = "rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
    const sizeClasses = {
        md: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-xs"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/app/components/ui/Button.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Button;
}),
"[project]/app/components/ui/Card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const Card = ({ children, className, title, description })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `bg-white shadow-md rounded-lg overflow-hidden ${className}`,
        children: [
            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 border-b border-gray-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold leading-6 text-gray-900",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/app/components/ui/Card.tsx",
                        lineNumber: 16,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-gray-500",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/app/components/ui/Card.tsx",
                        lineNumber: 17,
                        columnNumber: 33
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/ui/Card.tsx",
                lineNumber: 15,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6",
                children: children
            }, void 0, false, {
                fileName: "[project]/app/components/ui/Card.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/ui/Card.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Card;
}),
"[project]/app/components/admin/AdminConsole.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Card.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const AdminConsole = ({ onBack })=>{
    const [logs, setLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function fetchData() {
            try {
                const [logsData, usersData] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuditLogs"])(),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllUsers"])()
                ]);
                setLogs(logsData);
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally{
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    const [actorFilter, setActorFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('all');
    const [actionFilter, setActionFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('all');
    const [startDateFilter, setStartDateFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [endDateFilter, setEndDateFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const usersMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const map = new Map();
        users.forEach((user)=>map.set(user.id, user));
        return map;
    }, [
        users
    ]);
    const enrichedLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return logs.map((log)=>({
                ...log,
                actorDisplayName: usersMap.get(log.actorUserId)?.profile?.displayName || log.actorUserId,
                effectiveDisplayName: log.effectiveUserId ? usersMap.get(log.effectiveUserId)?.profile?.displayName || log.effectiveUserId : undefined
            }));
    }, [
        logs,
        usersMap
    ]);
    const filteredLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return enrichedLogs.filter((log)=>{
            if (actorFilter !== 'all' && log.actorUserId !== actorFilter) return false;
            if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
            if (startDateFilter) {
                const startDate = new Date(startDateFilter);
                if (log.createdAt < startDate) return false;
            }
            if (endDateFilter) {
                const endDate = new Date(endDateFilter);
                endDate.setHours(23, 59, 59, 999); // Include the whole day
                if (log.createdAt > endDate) return false;
            }
            return true;
        });
    }, [
        enrichedLogs,
        actorFilter,
        actionFilter,
        startDateFilter,
        endDateFilter
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-gray-900",
                        children: "Admin Console: Audit Log"
                    }, void 0, false, {
                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                        lineNumber: 82,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center py-8",
                    children: "Loading..."
                }, void 0, false, {
                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                    lineNumber: 84,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/app/components/admin/AdminConsole.tsx",
            lineNumber: 80,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold text-gray-900",
                                children: "Admin Console: Audit Log"
                            }, void 0, false, {
                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: "View and filter all audited actions across the platform."
                            }, void 0, false, {
                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        variant: "secondary",
                        onClick: onBack,
                        children: "← Back"
                    }, void 0, false, {
                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                title: "Filter Logs",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "actor-filter",
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Actor"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 102,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    id: "actor-filter",
                                    value: actorFilter,
                                    onChange: (e)=>setActorFilter(e.target.value),
                                    className: "w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "all",
                                            children: "All Users"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                            lineNumber: 104,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        users.map((user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: user.id,
                                                children: user.profile.displayName
                                            }, user.id, false, {
                                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                lineNumber: 105,
                                                columnNumber: 40
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 103,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                            lineNumber: 101,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "action-filter",
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Action Type"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 109,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    id: "action-filter",
                                    value: actionFilter,
                                    onChange: (e)=>setActionFilter(e.target.value),
                                    className: "w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "all",
                                            children: "All Actions"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                            lineNumber: 111,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ActionType"]).map((action)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: action,
                                                children: action
                                            }, action, false, {
                                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                lineNumber: 112,
                                                columnNumber: 62
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 110,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                            lineNumber: 108,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "start-date",
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Start Date"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 116,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "date",
                                    id: "start-date",
                                    value: startDateFilter,
                                    onChange: (e)=>setStartDateFilter(e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 117,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                            lineNumber: 115,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "end-date",
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "End Date"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 120,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "date",
                                    id: "end-date",
                                    value: endDateFilter,
                                    onChange: (e)=>setEndDateFilter(e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                    lineNumber: 121,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                    lineNumber: 100,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                lineNumber: 99,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flow-root",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "min-w-full divide-y divide-gray-300",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "bg-gray-50",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6",
                                                    children: "Date"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 133,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                                                    children: "Actor"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                                                    children: "Effective User"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 135,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                                                    children: "Action"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 136,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                                                    children: "Entity"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 137,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                                                    children: "Details"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                            lineNumber: 132,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                        lineNumber: 131,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        className: "divide-y divide-gray-200 bg-white",
                                        children: filteredLogs.map((log)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6",
                                                        children: log.createdAt.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 144,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                                                        children: log.actorDisplayName
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 145,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                                                        children: log.effectiveDisplayName || 'N/A'
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 146,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                                                        children: log.actionType
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 147,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                                                        children: log.entityType ? `${log.entityType} (${log.entityId})` : 'N/A'
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 148,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-3 py-4 text-xs text-gray-500",
                                                        children: log.metadata && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                            className: "bg-gray-100 p-2 rounded whitespace-pre-wrap max-w-sm",
                                                            children: JSON.stringify(log.metadata, null, 2)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                            lineNumber: 150,
                                                            columnNumber: 58
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 37
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, log.id, true, {
                                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                                lineNumber: 143,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                        lineNumber: 141,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                                lineNumber: 130,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/app/components/admin/AdminConsole.tsx",
                            lineNumber: 129,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/app/components/admin/AdminConsole.tsx",
                        lineNumber: 128,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/components/admin/AdminConsole.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/app/components/admin/AdminConsole.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/admin/AdminConsole.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = AdminConsole;
}),
"[project]/app/admin/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$admin$2f$AdminConsole$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/admin/AdminConsole.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function Page() {
    const { data: session, status } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSession"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function loadUser() {
            if (status === 'loading') return;
            if (!session?.user?.email) {
                router.push('/auth/login');
                return;
            }
            try {
                const userData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserByEmail"])(session.user.email);
                if (!userData || !userData.isSuperAdmin) {
                    router.push('/');
                    return;
                }
                setUser(userData);
            } catch (error) {
                console.error('Error loading user:', error);
                router.push('/');
            } finally{
                setLoading(false);
            }
        }
        loadUser();
    }, [
        session,
        status,
        router
    ]);
    if (loading || !user) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8",
            children: "Loading..."
        }, void 0, false, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 44,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$admin$2f$AdminConsole$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        onBack: ()=>router.push('/')
    }, void 0, false, {
        fileName: "[project]/app/admin/page.tsx",
        lineNumber: 47,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__32095290._.js.map