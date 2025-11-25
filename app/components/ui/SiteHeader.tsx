"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CONTROL_PANEL_TABS } from '@/constants';
import { useSession } from 'next-auth/react';
import type { Notification } from '@/types';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import Button from './Button';
import UserMenu from './UserMenu';

const navItems: { label: string; href: string; authOnly?: boolean }[] = [];

const SiteHeader = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isActive = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?limit=6', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        if (!isActive) return;
        const normalized: Notification[] = (data.notifications || []).map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
        }));
        setNotifications(normalized);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Notification fetch failed', error);
        if (isActive) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!isAuthenticated) return;
    setNotifications((prev) => prev.map((notification) => (notification.id === notificationId ? { ...notification, isRead: true } : notification)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!isAuthenticated) return;
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
    try {
      const response = await fetch('/api/notifications/mark-all', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationNavigate = (link?: string) => {
    if (!link) return;
    setPanelOpen(false);
    if (link.startsWith('http')) {
      window.location.href = link;
      return;
    }
    router.push(link);
  };

  const stickyOffsetStyle = { top: 'var(--impersonation-banner-offset, 0px)' } as const;

  // expose the header height to other components so their sticky offsets can align
  // with this header. Keep value in sync with Tailwind spacing used elsewhere.
  const headerStyle = { ...stickyOffsetStyle, ['--site-header-height' as any]: '4.5rem' } as any;

  return (
    <header
      className="sticky z-40 border-b border-white/30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={headerStyle}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* On tenant pages replace site logo with tenant hamburger menu */}
          {pathname?.startsWith('/tenants/') ? (
            <TenantMenuPlaceholder pathname={pathname} session={session} />
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
                </svg>
              </span>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Temple</span>
                <span className="text-lg font-semibold">Platform</span>
              </div>
              <span className="text-base font-semibold text-slate-700 sm:hidden">Temple</span>
            </Link>
          )}
          {!pathname?.startsWith('/tenants/') && (
            <nav className="hidden flex-1 items-center gap-2 text-sm font-medium text-slate-500 md:flex" aria-label="Primary">
              {navItems
                .filter((item) => (isAuthenticated ? true : !item.authOnly))
                .filter((item) => (pathname?.startsWith('/tenants') ? item.label !== 'Tenants' : true))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      pathname?.startsWith(item.href) ? 'bg-amber-50 text-amber-700' : 'hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          )}
          <div className="flex items-center gap-2" ref={notificationPanelRef}>
            {isAuthenticated ? (
              <>
                {/* Switch tenant removed from header per design */}
                <div className="relative">
                  <NotificationBell unreadCount={unreadCount} onClick={() => setPanelOpen((prev) => !prev)} />
                  {panelOpen && (
                    <NotificationPanel
                      notifications={notifications}
                      onClose={() => setPanelOpen(false)}
                      onMarkAsRead={handleMarkNotificationAsRead}
                      onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                      onNavigate={handleNotificationNavigate}
                    />
                  )}
                </div>
                <UserMenu user={session?.user as any} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/auth/login')}>
                  Log in
                </Button>
                <Button type="button" size="sm" onClick={() => router.push('/auth/register')}>
                  Create account
                </Button>
              </div>
            )}
          </div>
        </div>
        {!pathname?.startsWith('/tenants/') && (
          <nav className="flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-500 md:hidden" aria-label="Mobile">
            {navItems
              .filter((item) => (isAuthenticated ? true : !item.authOnly))
              .filter((item) => (pathname?.startsWith('/tenants') ? item.label !== 'Tenants' : true))
              .map((item) => (
                <Link
                  key={`${item.href}-mobile`}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1 transition-colors ${
                    pathname?.startsWith(item.href) ? 'bg-amber-50 text-amber-700' : 'hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;

function TenantMenuPlaceholder({ pathname, session }: { pathname?: string | null; session: any }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any | null>(null);
  const [showContentSubmenu, setShowContentSubmenu] = useState(false);
  const [showCommunitySubmenu, setShowCommunitySubmenu] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const showCommunityTimer = useRef<number | null>(null);
  const hideCommunityTimer = useRef<number | null>(null);
  const menuCloseTimer = useRef<number | null>(null);
  const [showServicesSubmenu, setShowServicesSubmenu] = useState(false);
  const showServicesTimer = useRef<number | null>(null);
  const hideServicesTimer = useRef<number | null>(null);
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const showSettingsTimer = useRef<number | null>(null);
  const hideSettingsTimer = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split('/');
    const tenantId = parts[2];
    if (!tenantId) return;

    let mounted = true;
    (async () => {
      try {
        // fetch tenant membership/permissions
        const res = await fetch(`/api/tenants/${tenantId}/me`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            const tenantIsAdmin = Boolean(data?.permissions?.isAdmin);
            const platformAdmin = Boolean((session as any)?.user?.isSuperAdmin);
            setIsAdmin(tenantIsAdmin || platformAdmin);
          }
        }
      } catch (e) {
        // ignore
      }
      try {
        // fetch tenant public settings for feature toggles
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

  // Close on Escape and manage focus return
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

  // When opening, move focus to first focusable item in the panel
  useEffect(() => {
    if (!open) return;
    // small delay to wait for rendering
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
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (menuCloseTimer.current) window.clearTimeout(menuCloseTimer.current);
    };
  }, []);

  return (
    <div
      className="relative flex items-center gap-3"
      ref={ref}
      onMouseEnter={() => {
        if (menuCloseTimer.current) {
          window.clearTimeout(menuCloseTimer.current);
          menuCloseTimer.current = null;
        }
      }}
      onMouseLeave={() => {
        if (menuCloseTimer.current) window.clearTimeout(menuCloseTimer.current);
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
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Temple</span>
        <span className="text-lg font-semibold">Platform</span>
      </div>
      <span className="text-base font-semibold text-slate-700 sm:hidden">Temple</span>

      {open && (
        <>
          {/* Mobile: full-width panel pinned to top, scrollable if long */}
          <div
            className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
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
                  { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
                  { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
                  { key: 'contact', label: 'Contact Us', path: '/contact' },
                  { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
                    ].map((item) => {
                const isEnabled = !item.feature || Boolean(tenantSettings?.[item.feature]);
                if (!isEnabled) return null;
                if (item.adminOnly && !isAdmin) return null;
                      if (item.key === 'community') {
                        // Mobile: render parent then inline community sublinks
                        return (
                          <div key={item.key}>
                            <Link
                              href={`${basePath}${item.path}`}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                if (menuCloseTimer.current) {
                                  window.clearTimeout(menuCloseTimer.current);
                                  menuCloseTimer.current = null;
                                }
                                setOpen(false);
                              }}
                              role="menuitem"
                              tabIndex={0}
                            >
                              <span className="inline-flex items-center justify-between w-full">
                                <span>{item.label}</span>
                                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </Link>
                            <div className="pl-6">
                              {[
                                { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
                                { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
                                { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
                                { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
                                { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
                                { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
                                { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
                                { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
                                { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
                              ].map((sub) => {
                                const enabled = !sub.feature || Boolean(tenantSettings?.[sub.feature]);
                                if (!enabled) return null;
                                return (
                                  <Link
                                    key={`sub-${sub.key}`}
                                    href={`${basePath}${sub.path}`}
                                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                    onClick={() => setOpen(false)}
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
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            if (menuCloseTimer.current) {
                              window.clearTimeout(menuCloseTimer.current);
                              menuCloseTimer.current = null;
                            }
                            setOpen(false);
                          }}
                          role="menuitem"
                          tabIndex={0}
                        >
                          {item.key === 'settings' ? (
                            <span className="inline-flex items-center gap-2">
                              <span>{item.label}</span>
                              <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.026 1.14c.962-.23 1.89.69 1.66 1.65a1.724 1.724 0 001.139 2.026c.92.3.92 1.603 0 1.902a1.724 1.724 0 00-1.14 2.026c.23.962-.69 1.89-1.65 1.66a1.724 1.724 0 00-2.026 1.139c-.3.92-1.603.92-1.902 0a1.724 1.724 0 00-2.026-1.14c-.962.23-1.89-.69-1.66-1.65a1.724 1.724 0 00-1.139-2.026c-.92-.3-.92-1.603 0-1.902a1.724 1.724 0 001.14-2.026c-.23-.962.69-1.89 1.65-1.66.7.166 1.47-.2 1.902-1.14z" />
                              </svg>
                            </span>
                          ) : item.key === 'content' ? (
                            <span className="inline-flex items-center gap-2">
                              <span>{item.label}</span>
                              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
            </div>
          </div>

          {/* Desktop / larger screens: dropdown anchored under button */}
          <div className="hidden sm:block absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="py-1 flex" role="menu" id={`tenant-menu-desktop-${tenantId || 'global'}`}>
              {/* Left column: primary menu items */}
              <div className="min-w-[18rem]">
                {[{ key: 'home', label: 'Home', path: '' },
                  { key: 'content', label: 'Content', path: '/content' },
                  { key: 'community', label: 'Community', path: '/community' },
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
                        onMouseEnter={() => {
                          // cancel any pending hide, start delayed show
                          if (hideTimer.current) {
                            window.clearTimeout(hideTimer.current);
                            hideTimer.current = null;
                          }
                          if (showTimer.current) window.clearTimeout(showTimer.current);
                          showTimer.current = window.setTimeout(() => setShowContentSubmenu(true), 300);
                        }}
                        onMouseLeave={() => {
                          // cancel pending show and start delayed hide
                          if (showTimer.current) {
                            window.clearTimeout(showTimer.current);
                            showTimer.current = null;
                          }
                          if (hideTimer.current) window.clearTimeout(hideTimer.current);
                          hideTimer.current = window.setTimeout(() => {
                            hideTimer.current = null;
                            setShowContentSubmenu(false);
                          }, 750);
                        }}
                      >
                        <Link
                          href={`${basePath}${item.path}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{item.label}</span>
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                        onMouseEnter={() => {
                          if (hideCommunityTimer.current) {
                            window.clearTimeout(hideCommunityTimer.current);
                            hideCommunityTimer.current = null;
                          }
                          if (showCommunityTimer.current) window.clearTimeout(showCommunityTimer.current);
                          showCommunityTimer.current = window.setTimeout(() => setShowCommunitySubmenu(true), 300);
                        }}
                        onMouseLeave={() => {
                          if (showCommunityTimer.current) {
                            window.clearTimeout(showCommunityTimer.current);
                            showCommunityTimer.current = null;
                          }
                          if (hideCommunityTimer.current) window.clearTimeout(hideCommunityTimer.current);
                          hideCommunityTimer.current = window.setTimeout(() => {
                            hideCommunityTimer.current = null;
                            setShowCommunitySubmenu(false);
                          }, 750);
                        }}
                      >
                        <Link
                          href={`${basePath}${item.path}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{item.label}</span>
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                        onMouseEnter={() => {
                          if (hideServicesTimer.current) {
                            window.clearTimeout(hideServicesTimer.current);
                            hideServicesTimer.current = null;
                          }
                          if (showServicesTimer.current) window.clearTimeout(showServicesTimer.current);
                          showServicesTimer.current = window.setTimeout(() => setShowServicesSubmenu(true), 300);
                        }}
                        onMouseLeave={() => {
                          if (showServicesTimer.current) {
                            window.clearTimeout(showServicesTimer.current);
                            showServicesTimer.current = null;
                          }
                          if (hideServicesTimer.current) window.clearTimeout(hideServicesTimer.current);
                          hideServicesTimer.current = window.setTimeout(() => {
                            hideServicesTimer.current = null;
                            setShowServicesSubmenu(false);
                          }, 750);
                        }}
                      >
                        <Link
                          href={`${basePath}${item.path}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{item.label}</span>
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                        onMouseEnter={() => {
                          if (hideSettingsTimer.current) {
                            window.clearTimeout(hideSettingsTimer.current);
                            hideSettingsTimer.current = null;
                          }
                          if (showSettingsTimer.current) window.clearTimeout(showSettingsTimer.current);
                          showSettingsTimer.current = window.setTimeout(() => setShowSettingsSubmenu(true), 300);
                        }}
                        onMouseLeave={() => {
                          if (showSettingsTimer.current) {
                            window.clearTimeout(showSettingsTimer.current);
                            showSettingsTimer.current = null;
                          }
                          if (hideSettingsTimer.current) window.clearTimeout(hideSettingsTimer.current);
                          hideSettingsTimer.current = window.setTimeout(() => {
                            hideSettingsTimer.current = null;
                            setShowSettingsSubmenu(false);
                          }, 750);
                        }}
                      >
                        <Link
                          href={`${basePath}${item.path}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{item.label}</span>
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      tabIndex={0}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Right column: content submenu (shows when hovered) */}
              {showContentSubmenu && (
                <div
                  className="w-44 border-l border-gray-100 bg-white"
                  onMouseEnter={() => {
                    // Cancel pending hide when entering the submenu
                    if (hideTimer.current) {
                      window.clearTimeout(hideTimer.current);
                      hideTimer.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    // Start delayed hide when leaving the submenu
                    if (showTimer.current) {
                      window.clearTimeout(showTimer.current);
                      showTimer.current = null;
                    }
                    if (hideTimer.current) window.clearTimeout(hideTimer.current);
                    hideTimer.current = window.setTimeout(() => {
                      hideTimer.current = null;
                      setShowContentSubmenu(false);
                    }, 750);
                  }}
                >
                  <div className="py-1">
                    <Link href={`${basePath}/photos`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Photos</Link>
                    <Link href={`${basePath}/podcasts`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Podcasts</Link>
                    <Link href={`${basePath}/sermons`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Sermons</Link>
                    <Link href={`${basePath}/books`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Books</Link>
                    <Link href={`${basePath}/livestream`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Live Stream</Link>
                  </div>
                </div>
              )}
              {showCommunitySubmenu && (
                <div
                  className="w-44 border-l border-gray-100 bg-white"
                  onMouseEnter={() => {
                    if (hideCommunityTimer.current) {
                      window.clearTimeout(hideCommunityTimer.current);
                      hideCommunityTimer.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (showCommunityTimer.current) {
                      window.clearTimeout(showCommunityTimer.current);
                      showCommunityTimer.current = null;
                    }
                    if (hideCommunityTimer.current) window.clearTimeout(hideCommunityTimer.current);
                    hideCommunityTimer.current = window.setTimeout(() => {
                      hideCommunityTimer.current = null;
                      setShowCommunitySubmenu(false);
                    }, 750);
                  }}
                >
                  <div className="py-1">
                    <Link href={`${basePath}/posts`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Posts</Link>
                    <Link href={`${basePath}/community/wall`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Wall</Link>
                    <Link href={`${basePath}/calendar`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Calendar</Link>
                    <Link href={`${basePath}/prayer-wall`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Prayer Wall</Link>
                    <Link href={`${basePath}/members`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Members</Link>
                    <Link href={`${basePath}/staff`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Staff</Link>
                    <Link href={`${basePath}/chat`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Chat</Link>
                    <Link href={`${basePath}/small-groups`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Small Groups</Link>
                    <Link href={`${basePath}/volunteering`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Volunteering</Link>
                    <Link href={`${basePath}/resources`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowCommunitySubmenu(false); }}>Resources</Link>
                  </div>
                </div>
              )}
              {showServicesSubmenu && (
                <div
                  className="w-44 border-l border-gray-100 bg-white"
                  onMouseEnter={() => {
                    if (hideServicesTimer.current) {
                      window.clearTimeout(hideServicesTimer.current);
                      hideServicesTimer.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (showServicesTimer.current) {
                      window.clearTimeout(showServicesTimer.current);
                      showServicesTimer.current = null;
                    }
                    if (hideServicesTimer.current) window.clearTimeout(hideServicesTimer.current);
                    hideServicesTimer.current = window.setTimeout(() => {
                      hideServicesTimer.current = null;
                      setShowServicesSubmenu(false);
                    }, 750);
                  }}
                >
                  <div className="py-1">
                          <Link href={`${basePath}/services?category=CEREMONY`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Ceremony</Link>
                          <Link href={`${basePath}/services?category=EDUCATION`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Education</Link>
                          <Link href={`${basePath}/services?category=COUNSELING`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Counseling</Link>
                          <Link href={`${basePath}/services?category=FACILITY`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Facilities</Link>
                          <Link href={`${basePath}/services?category=OTHER`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Other</Link>
                  </div>
                </div>
              )}
              {showSettingsSubmenu && (
                <div
                  className="w-64 border-l border-gray-100 bg-white"
                  onMouseEnter={() => {
                    if (hideSettingsTimer.current) {
                      window.clearTimeout(hideSettingsTimer.current);
                      hideSettingsTimer.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (showSettingsTimer.current) {
                      window.clearTimeout(showSettingsTimer.current);
                      showSettingsTimer.current = null;
                    }
                    if (hideSettingsTimer.current) window.clearTimeout(hideSettingsTimer.current);
                    hideSettingsTimer.current = window.setTimeout(() => {
                      hideSettingsTimer.current = null;
                      setShowSettingsSubmenu(false);
                    }, 750);
                  }}
                >
                  <div className="py-2 px-1">
                    {/* Map control panel tabs to chips/links */}
                    {(() => {
                      const slugFor = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      return CONTROL_PANEL_TABS.map((tab) => {
                        const slug = slugFor(tab);
                        return (
                          <Link
                            key={tab}
                            href={`${basePath}/settings${slug ? `?category=${slug}` : ''}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setOpen(false);
                              setShowSettingsSubmenu(false);
                            }}
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
