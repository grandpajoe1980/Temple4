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

const navItems = [
  { label: 'Tenants', href: '/tenants' },
  { label: 'Messages', href: '/messages', authOnly: true },
  { label: 'Account', href: '/account', authOnly: true },
  { label: 'Explore', href: '/explore' },
];

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
          <div className="flex items-center gap-2" ref={notificationPanelRef}>
            {isAuthenticated ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => router.push('/tenants')}
                >
                  Switch tenant
                </Button>
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
                <UserMenu user={session.user} />
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
      </div>
    </header>
  );
};

export default SiteHeader;
