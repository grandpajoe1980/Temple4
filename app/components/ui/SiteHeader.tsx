"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

  return (
    <header
      className="sticky z-40 border-b border-white/30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={stickyOffsetStyle}
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

  return (
    <div className="relative flex items-center gap-3" ref={ref}>
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
              { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
              { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
              { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
              { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
              { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
              { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
              { key: 'facilities', label: 'Facilities', path: '/facilities' },
              { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
              { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
              { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
              { key: 'sermons', label: 'Sermons', path: '/sermons', feature: 'enableSermons' },
              { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
              { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
              { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
              { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
              { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
              { key: 'contact', label: 'Contact', path: '/contact' },
                ].map((item) => {
              const isEnabled = !item.feature || Boolean(tenantSettings?.[item.feature]);
              if (!isEnabled) return null;
              if (item.adminOnly && !isAdmin) return null;
                  return (
                    <Link
                      key={item.key}
                      href={`${basePath}${item.path}`}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      tabIndex={0}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop / larger screens: dropdown anchored under button */}
          <div className="hidden sm:block absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="py-1" role="menu" id={`tenant-menu-desktop-${tenantId || 'global'}`}>
              {[
                { key: 'home', label: 'Home', path: '' },
                { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
                { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
                { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
                { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
                { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
                { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
                { key: 'facilities', label: 'Facilities', path: '/facilities' },
                { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
                { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
                { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
                { key: 'sermons', label: 'Sermons', path: '/sermons', feature: 'enableSermons' },
                { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
                { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
                { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
                { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
                { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
                { key: 'contact', label: 'Contact', path: '/contact' },
              ].map((item) => {
                const isEnabled = !item.feature || Boolean(tenantSettings?.[item.feature]);
                if (!isEnabled) return null;
                if (item.adminOnly && !isAdmin) return null;

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
          </div>
        </>
      )}
    </div>
  );
}
