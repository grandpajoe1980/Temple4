"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { CONTROL_PANEL_TABS } from '@/constants';

type TenantSubmenuKey = 'content' | 'community' | 'services' | 'settings';

interface TenantMenuProps {
    pathname?: string | null;
    session: any;
}

export default function TenantMenu({ pathname, session }: TenantMenuProps) {
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tenantSettings, setTenantSettings] = useState<any | null>(null);
    const [membership, setMembership] = useState<any | null>(null);
    const [tenantPermissions, setTenantPermissions] = useState<Record<string, any> | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [activeSubmenu, setActiveSubmenu] = useState<TenantSubmenuKey | null>(null);
    const submenuShowTimer = useRef<number | null>(null);
    const submenuHideTimer = useRef<number | null>(null);
    const menuCloseTimer = useRef<number | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const mobilePanelRef = useRef<HTMLDivElement | null>(null);

    const clearTimer = (timerRef: MutableRefObject<number | null>) => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const closeAllSubmenus = useCallback(() => {
        clearTimer(submenuShowTimer);
        clearTimer(submenuHideTimer);
        setActiveSubmenu(null);
    }, []);

    const scheduleSubmenuShow = (key: TenantSubmenuKey) => {
        clearTimer(submenuHideTimer);
        clearTimer(submenuShowTimer);
        setActiveSubmenu((prev) => (prev && prev !== key ? null : prev));
        submenuShowTimer.current = window.setTimeout(() => {
            setActiveSubmenu(key);
        }, 300);
    };

    const scheduleSubmenuHide = (key: TenantSubmenuKey) => {
        clearTimer(submenuShowTimer);
        clearTimer(submenuHideTimer);
        submenuHideTimer.current = window.setTimeout(() => {
            setActiveSubmenu((prev) => (prev === key ? null : prev));
        }, 750);
    };

    const handleNavClick = () => {
        clearTimer(menuCloseTimer);
        closeAllSubmenus();
        setOpen(false);
    };

    useEffect(() => {
        if (!pathname) return;
        const parts = pathname.split('/');
        const tenantId = parts[2];
        if (!tenantId) return;

        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`/api/tenants/${tenantId}/me`);
                if (res.ok) {
                    const data = await res.json();
                    if (mounted) {
                        const tenantIsAdmin = Boolean(data?.permissions?.isAdmin);
                        const platformAdmin = Boolean((session as any)?.user?.isSuperAdmin);
                        setIsAdmin(tenantIsAdmin || platformAdmin);
                        setMembership(data?.membership || null);
                        setTenantPermissions(data?.tenant?.permissions || null);
                        setUserPermissions(data?.permissions || null);
                    }
                }
            } catch (e) {
                // ignore
            }
            try {
                const tRes = await fetch(`/api/tenants/${tenantId}`);
                if (tRes.ok) {
                    const tData = await tRes.json();
                    if (mounted) setTenantSettings(tData?.settings || null);
                }
            } catch (e) {
                // ignore
            }
        })();

        return () => {
            mounted = false;
        };
    }, [pathname, session]);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (e.target instanceof Node && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        }
        if (open) {
            document.addEventListener('keydown', onKey);
        }
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const id = setTimeout(() => {
            const panel = mobilePanelRef.current || ref.current?.querySelector('[role="menu"]') as HTMLElement | null;
            const first = panel?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
            if (first) first.focus();
        }, 0);
        return () => clearTimeout(id);
    }, [open]);

    const parts = (pathname || '').split('/');
    const tenantId = parts[2];
    const basePath = tenantId ? `/tenants/${tenantId}` : '/';

    useEffect(() => {
        return () => {
            clearTimer(submenuShowTimer);
            clearTimer(submenuHideTimer);
            clearTimer(menuCloseTimer);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            closeAllSubmenus();
        }
    }, [open, closeAllSubmenus]);

    return (
        <div
            className="relative hidden md:flex items-center gap-3"
            ref={ref}
            onMouseEnter={() => {
                clearTimer(menuCloseTimer);
            }}
            onMouseLeave={() => {
                clearTimer(menuCloseTimer);
                menuCloseTimer.current = window.setTimeout(() => setOpen(false), 2000);
            }}
        >
            <button
                ref={buttonRef}
                aria-label="Open tenant menu"
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls={`tenant-menu-${tenantId || 'global'}`}
                onClick={() => setOpen((s) => !s)}
                className="p-2 rounded-md text-muted-foreground hover:bg-muted"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] tenant-text-primary">Asembli</span>
                <span className="text-lg font-semibold text-foreground">Platform</span>
            </div>
            <span className="text-base font-semibold text-muted-foreground sm:hidden">Asembli</span>

            {open && (
                <>
                    {/* Mobile: full-width panel pinned to top */}
                    <div
                        className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Tenant navigation"
                    >
                        <div ref={mobilePanelRef} id={`tenant-menu-${tenantId || 'global'}`} className="max-h-[100vh] overflow-y-auto" role="menu">
                            <div className="py-2">
                                {[
                                    { key: 'home', label: 'Home', path: '' },
                                    { key: 'content', label: 'Content', path: '/content' },
                                    { key: 'community', label: 'Community', path: '/community' },
                                    { key: 'work', label: 'Work', path: '/admin/workboard', adminOnly: true, feature: 'enableWorkboard' },
                                    { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
                                    { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
                                    { key: 'contact', label: 'Contact Us', path: '/contact' },
                                    { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
                                ].map((item) => {
                                    const isEnabled = !item.feature || Boolean(tenantSettings?.[item.feature]);
                                    if (!isEnabled) return null;
                                    // allow adminOnly when user is admin OR when it's the Work item and role-level permissions allow it
                                    if (item.adminOnly && item.key === 'work') {
                                        const allowed = isAdmin || Boolean(userPermissions?.canViewWorkMenu) || (membership && tenantPermissions && (() => {
                                            const roles: { role: string }[] = membership?.roles || [];
                                            for (const r of roles) {
                                                const key = r.role as string;
                                                if (tenantPermissions[key] && tenantPermissions[key].canViewWorkMenu) return true;
                                            }
                                            return false;
                                        })());
                                        if (!allowed) return null;
                                    } else if (item.adminOnly && !isAdmin) {
                                        return null;
                                    }
                                    if (item.key === 'community') {
                                        return (
                                            <div key={item.key}>
                                                <Link
                                                    href={`${basePath}${item.path}`}
                                                    className="block px-4 py-3 text-sm text-foreground hover:bg-muted"
                                                    onClick={handleNavClick}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                >
                                                    <span className="inline-flex items-center justify-between w-full">
                                                        <span>{item.label}</span>
                                                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                                <div className="pl-6">
                                                    {[
                                                        { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
                                                        { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
                                                        { key: 'supportRequests', label: 'Support Requests', path: '/support-requests', feature: 'enableSupportRequests' },
                                                        { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
                                                        { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
                                                        { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
                                                        { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
                                                        { key: 'trips', label: 'Trips', path: '/trips', feature: 'enableTrips' },
                                                        { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
                                                        { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
                                                    ].map((sub) => {
                                                        const enabled = !sub.feature || Boolean(tenantSettings?.[sub.feature]);
                                                        if (!enabled) return null;
                                                        return (
                                                            <Link
                                                                key={`sub-${sub.key}`}
                                                                href={`${basePath}${sub.path}`}
                                                                className={
                                                                    `block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}${sub.path}`)
                                                                        ? 'tenant-active'
                                                                        : 'text-muted-foreground hover:bg-muted'
                                                                    }`
                                                                }
                                                                onClick={handleNavClick}
                                                            >
                                                                {sub.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.key}
                                            href={`${basePath}${item.path}`}
                                            className="block px-4 py-3 text-sm text-foreground hover:bg-muted"
                                            onClick={handleNavClick}
                                            role="menuitem"
                                            tabIndex={0}
                                        >
                                            {item.key === 'settings' ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span>{item.label}</span>
                                                    <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.026 1.14c.962-.23 1.89.69 1.66 1.65a1.724 1.724 0 001.139 2.026c.92.3.92 1.603 0 1.902a1.724 1.724 0 00-1.14 2.026c.23.962-.69 1.89-1.65 1.66a1.724 1.724 0 00-2.026 1.139c-.3.92-1.603.92-1.902 0a1.724 1.724 0 00-2.026-1.14c-.962.23-1.89-.69-1.66-1.65a1.724 1.724 0 00-1.139-2.026c-.92-.3-.92-1.603 0-1.902a1.724 1.724 0 001.14-2.026c-.23-.962.69-1.89 1.65-1.66.7.166 1.47-.2 1.902-1.14z" />
                                                    </svg>
                                                </span>
                                            ) : item.key === 'content' ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span>{item.label}</span>
                                                    <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            ) : (
                                                item.label
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                            {/* Divider and site-level links */}
                            <div className="border-t border-border mt-2" />
                            <div className="py-2">
                                <Link href="/" className="block px-4 py-3 text-sm text-foreground hover:bg-muted" onClick={handleNavClick} role="menuitem">
                                    Asembli
                                </Link>
                                <Link href="/explore" className="block px-4 py-3 text-sm text-foreground hover:bg-muted" onClick={handleNavClick} role="menuitem">
                                    Explore
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Desktop / larger screens: dropdown anchored under button */}
                    <div className="hidden sm:block absolute left-0 top-full mt-2 bg-card border border-border rounded-md shadow-lg z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
                        <div className="py-1 flex" role="menu" id={`tenant-menu-desktop-${tenantId || 'global'}`}>
                            {/* Left column: primary menu items */}
                            <div className="min-w-[18rem]">
                                {[
                                    { key: 'home', label: 'Home', path: '' },
                                        { key: 'content', label: 'Content', path: '/content' },
                                        { key: 'community', label: 'Community', path: '/community' },
                                        { key: 'work', label: 'Work', path: '/admin/workboard', adminOnly: true, feature: 'enableWorkboard' },
                                        { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
                                        { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
                                        { key: 'contact', label: 'Contact Us', path: '/contact' },
                                        { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
                                ].map((item) => {
                                    const isEnabled = !item.feature || Boolean(tenantSettings?.[item.feature]);
                                    if (!isEnabled) return null;
                                    if (item.adminOnly && !isAdmin) return null;

                                    if (item.key === 'content') {
                                        return (
                                            <div
                                                key={item.key}
                                                className="relative"
                                                onMouseEnter={() => scheduleSubmenuShow('content')}
                                                onMouseLeave={() => scheduleSubmenuHide('content')}
                                            >
                                                <Link
                                                    href={`${basePath}${item.path}`}
                                                    className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}${item.path}`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`}
                                                    onClick={handleNavClick}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{item.label}</span>
                                                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                            </div>
                                        );
                                    }

                                    if (item.key === 'community') {
                                        return (
                                            <div
                                                key={item.key}
                                                className="relative"
                                                onMouseEnter={() => scheduleSubmenuShow('community')}
                                                onMouseLeave={() => scheduleSubmenuHide('community')}
                                            >
                                                <Link
                                                    href={`${basePath}${item.path}`}
                                                    className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}${item.path}`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`}
                                                    onClick={handleNavClick}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{item.label}</span>
                                                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                            </div>
                                        );
                                    }

                                    if (item.key === 'services') {
                                        return (
                                            <div
                                                key={item.key}
                                                className="relative"
                                                onMouseEnter={() => scheduleSubmenuShow('services')}
                                                onMouseLeave={() => scheduleSubmenuHide('services')}
                                            >
                                                <Link
                                                    href={`${basePath}${item.path}`}
                                                    className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}${item.path}`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`}
                                                    onClick={handleNavClick}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{item.label}</span>
                                                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                            </div>
                                        );
                                    }

                                    if (item.key === 'settings') {
                                        return (
                                            <div
                                                key={item.key}
                                                className="relative"
                                                onMouseEnter={() => scheduleSubmenuShow('settings')}
                                                onMouseLeave={() => scheduleSubmenuHide('settings')}
                                            >
                                                <Link
                                                    href={`${basePath}${item.path}`}
                                                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                                    onClick={handleNavClick}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{item.label}</span>
                                                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.026 1.14c.962-.23 1.89.69 1.66 1.65a1.724 1.724 0 001.139 2.026c.92.3.92 1.603 0 1.902a1.724 1.724 0 00-1.14 2.026c.23.962-.69 1.89-1.65 1.66a1.724 1.724 0 00-2.026 1.139c-.3.92-1.603.92-1.902 0a1.724 1.724 0 00-2.026-1.14c-.962.23-1.89-.69-1.66-1.65a1.724 1.724 0 00-1.139-2.026c-.92-.3-.92-1.603 0-1.902a1.724 1.724 0 001.14-2.026c-.23-.962.69-1.89 1.65-1.66.7.166 1.47-.2 1.902-1.14z" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.key}
                                            href={`${basePath}${item.path}`}
                                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            onClick={handleNavClick}
                                            role="menuitem"
                                            tabIndex={0}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                                {/* Divider and site-level links for desktop menu */}
                                <div className="border-t border-border mt-1" />
                                <Link href="/" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={handleNavClick} role="menuitem">Asembli</Link>
                                <Link href="/explore" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={handleNavClick} role="menuitem">Explore</Link>
                            </div>

                            {/* Right column: submenu (shows when hovered) */}
                            {activeSubmenu === 'content' && (
                                <div
                                    className="w-44 border-l border-border bg-card"
                                    onMouseEnter={() => {
                                        clearTimer(submenuHideTimer);
                                        setActiveSubmenu('content');
                                    }}
                                    onMouseLeave={() => scheduleSubmenuHide('content')}
                                >
                                    <div className="py-1">
                                        <Link href={`${basePath}/photos`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/photos`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Photos</Link>
                                        <Link href={`${basePath}/podcasts`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/podcasts`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Podcasts</Link>
                                        <Link href={`${basePath}/talks`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/talks`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Talks</Link>
                                        <Link href={`${basePath}/books`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/books`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Books</Link>
                                        <Link href={`${basePath}/livestream`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/livestream`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Live Stream</Link>
                                    </div>
                                </div>
                            )}
                            {activeSubmenu === 'community' && (
                                <div
                                    className="w-44 border-l border-border bg-card"
                                    onMouseEnter={() => {
                                        clearTimer(submenuHideTimer);
                                        setActiveSubmenu('community');
                                    }}
                                    onMouseLeave={() => scheduleSubmenuHide('community')}
                                >
                                    <div className="py-1">
                                        <Link href={`${basePath}/posts`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/posts`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Posts</Link>
                                        <Link href={`${basePath}/community/wall`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/community/wall`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Wall</Link>
                                        <Link href={`${basePath}/calendar`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/calendar`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Calendar</Link>
                                        <Link href={`${basePath}/support-requests`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/support-requests`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Support Requests</Link>
                                        <Link href={`${basePath}/members`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/members`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Members</Link>
                                        <Link href={`${basePath}/staff`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/staff`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Staff</Link>
                                        <Link href={`${basePath}/chat`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/chat`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Chat</Link>
                                        <Link href={`${basePath}/small-groups`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/small-groups`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Small Groups</Link>
                                        <Link href={`${basePath}/trips`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/trips`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Trips</Link>
                                        <Link href={`${basePath}/volunteering`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/volunteering`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Volunteering</Link>
                                        <Link href={`${basePath}/resources`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/resources`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Resources</Link>
                                    </div>
                                </div>
                            )}
                            {activeSubmenu === 'services' && (
                                <div
                                    className="w-44 border-l border-border bg-card"
                                    onMouseEnter={() => {
                                        clearTimer(submenuHideTimer);
                                        setActiveSubmenu('services');
                                    }}
                                    onMouseLeave={() => scheduleSubmenuHide('services')}
                                >
                                    <div className="py-1">
                                        <Link href={`${basePath}/services?category=CEREMONY`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/services`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Ceremony</Link>
                                        <Link href={`${basePath}/services?category=EDUCATION`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/services`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Education</Link>
                                        <Link href={`${basePath}/services?category=COUNSELING`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/services`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Counseling</Link>
                                        <Link href={`${basePath}/services?category=FACILITY`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/services`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Facilities</Link>
                                        <Link href={`${basePath}/services?category=OTHER`} className={`block px-4 py-2 text-sm ${pathname?.startsWith(`${basePath}/services`) ? 'tenant-active' : 'text-foreground hover:bg-muted'}`} onClick={handleNavClick}>Other</Link>
                                    </div>
                                </div>
                            )}
                            {activeSubmenu === 'settings' && (
                                <div
                                    className="w-64 border-l border-border bg-card"
                                    onMouseEnter={() => {
                                        clearTimer(submenuHideTimer);
                                        setActiveSubmenu('settings');
                                    }}
                                    onMouseLeave={() => scheduleSubmenuHide('settings')}
                                >
                                    <div className="py-2 px-1">
                                        {(() => {
                                            const slugFor = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                            const preferredOrder = ['General', 'Features', 'Permissions', 'Membership & Moderation'];
                                            const ordered: string[] = [];
                                            for (const p of preferredOrder) {
                                                if (CONTROL_PANEL_TABS.includes(p)) ordered.push(p);
                                            }
                                            for (const t of CONTROL_PANEL_TABS) {
                                                if (!ordered.includes(t)) ordered.push(t);
                                            }
                                            return ordered.map((tab) => {
                                                const slug = slugFor(tab);
                                                return (
                                                    <Link
                                                        key={tab}
                                                        href={`${basePath}/settings${slug ? `?category=${slug}` : ''}`}
                                                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                                        onClick={handleNavClick}
                                                    >
                                                        {tab}
                                                    </Link>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
