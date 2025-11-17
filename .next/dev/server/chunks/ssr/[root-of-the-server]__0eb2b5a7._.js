module.exports = [
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const prisma = global.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) global.prisma = prisma;
}),
"[project]/app/api/auth/[...nextauth]/route.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler,
    "authOptions",
    ()=>authOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
;
;
;
;
const authOptions = {
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])({
            name: 'Credentials',
            credentials: {
                email: {
                    label: "Email",
                    type: "text"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            async authorize (credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
                    where: {
                        email: credentials.email.toLowerCase()
                    }
                });
                if (user && user.password && await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].compare(credentials.password, user.password)) {
                    // Return user object without password
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                } else {
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt ({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isSuperAdmin = user.isSuperAdmin;
            }
            return token;
        },
        async session ({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.isSuperAdmin = token.isSuperAdmin;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login'
    }
};
const handler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(authOptions);
;
}),
"[project]/lib/data.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTenant",
    ()=>createTenant,
    "getEventsForTenant",
    ()=>getEventsForTenant,
    "getMembershipForUserInTenant",
    ()=>getMembershipForUserInTenant,
    "getNotificationsForUser",
    ()=>getNotificationsForUser,
    "getOrCreateDirectConversation",
    ()=>getOrCreateDirectConversation,
    "getPostsForTenant",
    ()=>getPostsForTenant,
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
    "logAuditEvent",
    ()=>logAuditEvent,
    "markAllNotificationsAsRead",
    ()=>markAllNotificationsAsRead,
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
    "updateTenant",
    ()=>updateTenant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
;
;
;
async function getTenantsForUser(userId) {
    const memberships = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findMany({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.findMany({
        include: {
            settings: true,
            branding: true
        }
    });
}
async function getEventsForTenant(tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.findMany({
        where: {
            tenantId
        },
        orderBy: {
            startDateTime: 'asc'
        }
    });
}
async function getPostsForTenant(tenantId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].post.findMany({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId
            }
        }
    });
}
async function getNotificationsForUser(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].notification.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}
async function markNotificationAsRead(notificationId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].notification.update({
        where: {
            id: notificationId
        },
        data: {
            isRead: true
        }
    });
}
async function markAllNotificationsAsRead(userId) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].notification.updateMany({
        where: {
            userId
        },
        data: {
            isRead: true
        }
    });
}
async function getUserByEmail(email) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
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
    const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(pass, 10);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.create({
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
    const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.create({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.update({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.create({
        data: {
            userId,
            tenantId,
            roles: {
                create: {
                    role: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].MEMBER
                }
            },
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["MembershipStatus"].REQUESTED
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
    const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(newPass, 10);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].auditLog.create({
        data: {
            ...event,
            metadata: event.metadata || {}
        }
    });
}
async function getOrCreateDirectConversation(userId1, userId2) {
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].conversation.findFirst({
        where: {
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
    return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].conversation.create({
        data: {
            isDirect: true,
            isPrivateGroup: false,
            createdByUserId: userId1,
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
}),
"[project]/lib/permissions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TenantRoleType",
    ()=>TenantRoleType,
    "can",
    ()=>can,
    "canDeleteMessage",
    ()=>canDeleteMessage,
    "canUserPost",
    ()=>canUserPost,
    "canUserViewContent",
    ()=>canUserViewContent,
    "hasRole",
    ()=>hasRole
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
;
;
var TenantRoleType = /*#__PURE__*/ function(TenantRoleType) {
    TenantRoleType["MEMBER"] = "MEMBER";
    TenantRoleType["STAFF"] = "STAFF";
    TenantRoleType["MODERATOR"] = "MODERATOR";
    return TenantRoleType;
}({});
async function getMembershipForUserInTenant(userId, tenantId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId
            }
        },
        include: {
            roles: {
                select: {
                    role: true
                }
            }
        }
    });
}
/**
 * Maps a specific TenantRole to a more general TenantRoleType for permission lookups.
 */ function getRoleType(role) {
    switch(role){
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].ADMIN:
            return 'ADMIN';
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].STAFF:
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].CLERGY:
            return "STAFF";
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].MODERATOR:
            return "MODERATOR";
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].MEMBER:
            return "MEMBER";
        default:
            return "MEMBER";
    }
}
async function can(user, tenant, permission) {
    // Super Admins can do anything.
    if (user.isSuperAdmin) {
        return true;
    }
    // Find the user's membership for this specific tenant.
    const membership = await getMembershipForUserInTenant(user.id, tenant.id);
    // If the user is not a member or not approved, they have no permissions.
    if (!membership || membership.status !== 'APPROVED') {
        return false;
    }
    // Check if any of the user's roles grant the required permission.
    for (const roleInfo of membership.roles){
        const roleType = getRoleType(roleInfo.role);
        const permissions = tenant.permissions;
        if (roleType === 'ADMIN') {
            // Admins have all permissions defined under the ADMIN key.
            if (permissions.ADMIN[permission]) {
                return true;
            }
        } else {
            // For other roles, check against their TenantRoleType.
            const rolePerms = permissions[roleType];
            if (rolePerms && rolePerms[permission]) {
                return true; // Permission granted by at least one role.
            }
        }
    }
    return false; // No role granted the permission.
}
async function hasRole(userId, tenantId, requiredRoles) {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    if (!membership || membership.status !== 'APPROVED') {
        return false;
    }
    return membership.roles.some((roleInfo)=>requiredRoles.includes(roleInfo.role));
}
async function canUserViewContent(userId, tenantId, contentType) {
    const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            id: tenantId
        },
        include: {
            settings: true
        }
    });
    if (!tenant || !tenant.settings) return false;
    const settings = tenant.settings;
    // Check if the entire feature is disabled
    const featureFlag = `enable${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
    if (!settings[featureFlag]) {
        return false;
    }
    const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;
    // If user is not a member, check public visibility settings
    if (!membership || membership.status !== 'APPROVED') {
        return settings.visitorVisibility[contentType];
    }
    // If they are an approved member, they can view it as long as the feature is enabled.
    return true;
}
async function canUserPost(userId, tenantId, isAnnouncement) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        }
    });
    const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            id: tenantId
        },
        include: {
            permissions: true
        }
    });
    if (!user || !tenant) return false;
    if (isAnnouncement) {
        return can(user, tenant, 'canPostInAnnouncementChannels');
    }
    return can(user, tenant, 'canCreatePosts');
}
async function canDeleteMessage(user, message, conversation, tenant) {
    if (user.isSuperAdmin) {
        return true;
    }
    // User can delete their own message
    if (message.userId === user.id) {
        return true;
    }
    // Check for moderation permissions
    if (!conversation.isDirectMessage) {
        if (await can(user, tenant, 'canModerateChats')) {
            return true;
        }
    }
    return false;
}
}),
"[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/app/tenants/[tenantId]/TenantNav.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/tenants/[tenantId]/TenantNav.tsx <module evaluation>", "default");
}),
"[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/app/tenants/[tenantId]/TenantNav.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/tenants/[tenantId]/TenantNav.tsx", "default");
}),
"[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$tenants$2f5b$tenantId$5d2f$TenantNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$tenants$2f5b$tenantId$5d2f$TenantNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$tenants$2f5b$tenantId$5d2f$TenantNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/app/tenants/[tenantId]/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TenantLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/next/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/auth/[...nextauth]/route.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/permissions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$tenants$2f5b$tenantId$5d2f$TenantNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/tenants/[tenantId]/TenantNav.tsx [app-rsc] (ecmascript)"); // This will be the client component for navigation
;
;
;
;
;
;
;
;
;
async function TenantLayout({ children, params }) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["authOptions"]);
    if (!session || !session.user) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/auth/login');
    }
    const tenant = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTenantById"])(params.tenantId);
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getUserById"])(session.user.id);
    if (!tenant || !user) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/');
    }
    const canViewSettings = user.isSuperAdmin || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasRole"])(user.id, tenant.id, [
        __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TenantRole"].ADMIN
    ]) || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["can"])(user, tenant, 'canApproveMembership') || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["can"])(user, tenant, 'canBanMembers') || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["can"])(user, tenant, 'canManagePrayerWall') || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["can"])(user, tenant, 'canManageResources') || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["can"])(user, tenant, 'canManageContactSubmissions');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-100 min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white shadow-sm sticky top-0 z-20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center py-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-4",
                                    children: [
                                        tenant.branding?.logoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: tenant.branding.logoUrl,
                                            alt: `${tenant.name} Logo`,
                                            className: "h-8 w-auto"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 45,
                                            columnNumber: 26
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            xmlns: "http://www.w3.org/2000/svg",
                                            className: "h-8 w-8 text-amber-600",
                                            viewBox: "http://www.w3.org/2000/svg",
                                            fill: "currentColor",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M12 2L1 9l4 2.18v6.32L12 22l7-4.5V11.18L23 9l-3-1.68V5h-2v1.32L12 2zm0 16.5l-5-3.25V11.4l5 2.75v5.6zM12 12L7 9.25 12 6.5 17 9.25 12 12z"
                                            }, void 0, false, {
                                                fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                                lineNumber: 48,
                                                columnNumber: 29
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 47,
                                            columnNumber: 26
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-xl font-bold text-gray-800 hidden md:block",
                                            children: tenant.name
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 51,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                    lineNumber: 43,
                                    columnNumber: 18
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2 md:space-x-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/",
                                            className: "text-sm font-medium text-gray-600 hover:text-amber-700 hidden sm:block",
                                            children: "← Switch Tenant"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 54,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/messages",
                                            className: "text-sm font-medium text-gray-600 hover:text-amber-700",
                                            children: "Global Messages"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 58,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/account",
                                            className: "text-sm font-medium text-gray-600 hover:text-amber-700",
                                            children: "Account"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 59,
                                            columnNumber: 21
                                        }, this),
                                        user.isSuperAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/admin",
                                            className: "text-sm font-medium text-red-600 hover:text-red-800",
                                            children: "Admin Console"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 61,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: user.profile?.avatarUrl,
                                                    alt: user.profile?.displayName,
                                                    className: "h-8 w-8 rounded-full"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                                    lineNumber: 64,
                                                    columnNumber: 26
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-semibold text-amber-700 text-sm hidden sm:block",
                                                    children: user.profile?.displayName
                                                }, void 0, false, {
                                                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                                    lineNumber: 65,
                                                    columnNumber: 26
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 63,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/api/auth/signout",
                                            className: "text-sm font-medium text-gray-600 hover:text-amber-700",
                                            children: "Logout"
                                        }, void 0, false, {
                                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                            lineNumber: 67,
                                            columnNumber: 22
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                                    lineNumber: 53,
                                    columnNumber: 18
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                            lineNumber: 42,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$tenants$2f5b$tenantId$5d2f$TenantNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            tenant: tenant,
                            canViewSettings: canViewSettings
                        }, void 0, false, {
                            fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "py-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto sm:px-6 lg:px-8",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
                lineNumber: 73,
                columnNumber: 8
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/tenants/[tenantId]/layout.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0eb2b5a7._.js.map