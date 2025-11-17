module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

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
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler,
    "authOptions",
    ()=>authOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
;
;
const authOptions = {
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
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
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
                    where: {
                        email: credentials.email.toLowerCase()
                    },
                    include: {
                        profile: true
                    }
                });
                if (user && user.password && await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(credentials.password, user.password)) {
                    // Return user object with required fields for NextAuth
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.profile?.displayName || user.email,
                        isSuperAdmin: user.isSuperAdmin
                    };
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
                token.email = user.email;
                token.name = user.name;
                token.isSuperAdmin = user.isSuperAdmin;
            }
            return token;
        },
        async session ({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.isSuperAdmin = token.isSuperAdmin;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login'
    }
};
const handler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(authOptions);
;
}),
"[project]/lib/permissions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
;
;
var TenantRoleType = /*#__PURE__*/ function(TenantRoleType) {
    TenantRoleType["MEMBER"] = "MEMBER";
    TenantRoleType["STAFF"] = "STAFF";
    TenantRoleType["MODERATOR"] = "MODERATOR";
    return TenantRoleType;
}({});
async function getMembershipForUserInTenant(userId, tenantId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].userTenantMembership.findUnique({
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
        // If permissions is null or undefined, no permissions are granted
        if (!permissions) {
            continue;
        }
        if (roleType === 'ADMIN') {
            // Admins have all permissions defined under the ADMIN key.
            if (permissions.ADMIN && permissions.ADMIN[permission]) {
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
    try {
        const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
            where: {
                id: tenantId
            },
            include: {
                settings: true
            }
        });
        if (!tenant || !tenant.settings) {
            return false;
        }
        const settings = tenant.settings;
        // Check if the entire feature is disabled
        const featureFlag = `enable${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        if (!settings[featureFlag]) {
            return false;
        }
        const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;
        // If user is not a member, check public visibility settings
        if (!membership || membership.status !== 'APPROVED') {
            // Check if visitorVisibility exists and has the content type property
            if (!settings.visitorVisibility || typeof settings.visitorVisibility !== 'object') {
                return false;
            }
            const result = settings.visitorVisibility[contentType] === true;
            return result;
        }
        // If they are an approved member, they can view it as long as the feature is enabled.
        return true;
    } catch (error) {
        console.error('[canUserViewContent] Error:', error);
        throw error;
    }
}
async function canUserPost(userId, tenantId, isAnnouncement) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        }
    });
    const tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            id: tenantId
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
"[project]/types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/app/api/tenants/[tenantId]/admin/audit-logs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/next/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/permissions.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-route] (ecmascript)");
;
;
;
;
;
;
const prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
async function GET(request, { params }) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
    const user = session?.user;
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Not authenticated'
        }, {
            status: 401
        });
    }
    try {
        const isAdmin = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasRole"])(user, params.tenantId, __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TenantRole"].ADMIN);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'You do not have permission to view audit logs.'
            }, {
                status: 403
            });
        }
        const auditLogs = await prisma.auditLog.findMany({
            // This is a simplified query. In a real app, you'd probably want to filter by entityType/entityId
            // that are relevant to the current tenant. This would require schema changes.
            // For now, we return all audit logs.
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                actorUser: {
                    select: {
                        id: true,
                        profile: true
                    }
                },
                effectiveUser: {
                    select: {
                        id: true,
                        profile: true
                    }
                }
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(auditLogs);
    } catch (error) {
        console.error(`Failed to fetch audit logs for tenant ${params.tenantId}:`, error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Failed to fetch audit logs'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__403fa204._.js.map