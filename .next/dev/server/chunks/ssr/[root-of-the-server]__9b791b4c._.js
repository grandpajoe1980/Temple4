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
"[project]/app/tenants/[tenantId]/TenantNav.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TenantNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
const navItems = [
    {
        key: 'home',
        label: 'Home',
        path: ''
    },
    {
        key: 'settings',
        label: 'Settings',
        path: '/settings',
        adminOnly: true
    },
    {
        key: 'posts',
        label: 'Posts',
        path: '/posts',
        feature: 'enablePosts'
    },
    {
        key: 'calendar',
        label: 'Calendar',
        path: '/calendar',
        feature: 'enableCalendar'
    },
    {
        key: 'volunteering',
        label: 'Volunteering',
        path: '/volunteering',
        feature: 'enableVolunteering'
    },
    {
        key: 'smallGroups',
        label: 'Small Groups',
        path: '/small-groups',
        feature: 'enableSmallGroups'
    },
    {
        key: 'liveStream',
        label: 'Live Stream',
        path: '/livestream',
        feature: 'enableLiveStream'
    },
    {
        key: 'prayerWall',
        label: 'Prayer Wall',
        path: '/prayer-wall',
        feature: 'enablePrayerWall'
    },
    {
        key: 'resourceCenter',
        label: 'Resources',
        path: '/resources',
        feature: 'enableResourceCenter'
    },
    {
        key: 'sermons',
        label: 'Sermons',
        path: '/sermons',
        feature: 'enableSermons'
    },
    {
        key: 'podcasts',
        label: 'Podcasts',
        path: '/podcasts',
        feature: 'enablePodcasts'
    },
    {
        key: 'books',
        label: 'Books',
        path: '/books',
        feature: 'enableBooks'
    },
    {
        key: 'members',
        label: 'Members',
        path: '/members',
        feature: 'enableMemberDirectory'
    },
    {
        key: 'chat',
        label: 'Chat',
        path: '/chat',
        feature: 'enableGroupChat'
    },
    {
        key: 'donations',
        label: 'Donations',
        path: '/donations',
        feature: 'enableDonations'
    },
    {
        key: 'contact',
        label: 'Contact',
        path: '/contact'
    }
];
function TenantNav({ tenant, canViewSettings }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const basePath = `/tenants/${tenant.id}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "-mb-px flex space-x-6 overflow-x-auto border-t border-gray-200",
        children: navItems.map((item)=>{
            const isEnabled = !item.feature || tenant.settings && tenant.settings[item.feature];
            if (!isEnabled) return null;
            if (item.adminOnly && !canViewSettings) return null;
            const fullPath = `${basePath}${item.path}`;
            const isActive = pathname === fullPath || item.path === '' && pathname === basePath;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                href: fullPath,
                className: `${isActive ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`,
                children: item.label
            }, item.key, false, {
                fileName: "[project]/app/tenants/[tenantId]/TenantNav.tsx",
                lineNumber: 50,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/app/tenants/[tenantId]/TenantNav.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9b791b4c._.js.map