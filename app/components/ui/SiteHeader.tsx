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
import MobileNav from './MobileNav';
import TenantMenu from './TenantMenu';
import { ThemeToggle } from '../ThemeToggle';
import { usePageHeader } from './PageHeaderContext';

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

  // Page-specific header content from context
  const { config: pageHeaderConfig } = usePageHeader();

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
      className="sticky z-40 border-b border-border/30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border/50"
      style={headerStyle}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile hamburger menu - shown on all pages on mobile */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <MobileNav />

            {/* On tenant pages replace site logo with tenant hamburger menu (desktop only) */}
            {pathname?.startsWith('/tenants/') ? (
              <TenantMenu pathname={pathname} session={session} />
            ) : (
              <Link
                href="/"
                className="flex items-center gap-3 rounded-full px-2 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl tenant-bg-100 tenant-text-primary">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
                  </svg>
                </span>
                  <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] tenant-text-primary">Asembli</span>
                  <span className="text-lg font-semibold text-foreground">Platform</span>
                </div>
                <span className="text-base font-semibold text-muted-foreground sm:hidden">Asembli</span>
              </Link>
            )}

            {/* Page-specific title and actions injected from pages via context */}
            {pageHeaderConfig && (
              <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-4 pl-2 md:pl-4 border-l border-border min-w-0 flex-1">
                <h1 className="font-semibold text-foreground truncate" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}>{pageHeaderConfig.title}</h1>
                {pageHeaderConfig.actions && (
                  <div className="flex-shrink-0">{pageHeaderConfig.actions}</div>
                )}
              </div>
            )}
          </div>
          {!pathname?.startsWith('/tenants/') && (
            <nav className="hidden flex-1 items-center gap-2 text-sm font-medium text-muted-foreground md:flex" aria-label="Primary">
              {navItems
                .filter((item) => (isAuthenticated ? true : !item.authOnly))
                .filter((item) => (pathname?.startsWith('/tenants') ? item.label !== 'Tenants' : true))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1 transition-colors ${pathname?.startsWith(item.href) ? 'tenant-active' : 'hover:text-foreground'}`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          )}
          <div className="flex items-center gap-2" ref={notificationPanelRef}>
            <ThemeToggle size="sm" />
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
        {/* Mobile nav row removed - now using MobileNav sheet drawer instead */}
      </div>
    </header>
  );
};

export default SiteHeader;
