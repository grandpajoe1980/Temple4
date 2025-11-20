"use client"

import React, { useState, useEffect } from 'react';
import { TenantRole as TenantRoleType, type Tenant, type User, type Notification } from '@/types';
import { TenantRole } from '@/types';
import Button from '../ui/Button';
import ControlPanel from './ControlPanel';
import PostsPage from './PostsPage';
import EventsPage from './EventsPage';
import MembersPage from './MembersPage';
import SermonsPage from './SermonsPage';
import PodcastsPage from './PodcastsPage';
import BooksPage from './BooksPage';
import HomePage from './HomePage';
import ChatPage from './ChatPage';
// Use API endpoints from the client rather than importing server helpers
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import DonationsPage from './DonationsPage';
import ContactPage from './ContactPage';
import VolunteeringPage from './VolunteeringPage';
import SmallGroupsPage from './SmallGroupsPage';
import LiveStreamPage from './LiveStreamPage';
import PrayerWallPage from './PrayerWallPage';
import ResourceCenterPage from './ResourceCenterPage';

interface TenantLayoutProps {
  tenant: Tenant;
  user: User;
  onUpdateTenant: (tenant: Tenant) => void;
  onBackToSelect: () => void;
  onLogout: () => void;
  onImpersonate: (user: User) => void;
  onViewProfile: (userId: string) => void;
  onNavigateToMessages: () => void;
  onNavigateToAdminConsole: () => void;
  onRefresh: () => void;
}

type TenantPage = 'home' | 'settings' | 'posts' | 'calendar' | 'sermons' | 'podcasts' | 'books' | 'members' | 'chat' | 'donations' | 'contact' | 'volunteering' | 'smallGroups' | 'liveStream' | 'prayerWall' | 'resourceCenter';

const TenantLayout: React.FC<TenantLayoutProps> = ({ tenant, user, onUpdateTenant, onBackToSelect, onLogout, onImpersonate, onViewProfile, onNavigateToMessages, onNavigateToAdminConsole, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState<TenantPage>('home');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [canViewSettings, setCanViewSettings] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [canCreatePosts, setCanCreatePosts] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/notifications?limit=6', { cache: 'no-store' });
        if (!res.ok) {
          console.error('Failed to load notifications', res.status);
          setNotifications([]);
          return;
        }
        const data = await res.json().catch(() => ({ notifications: [] }));
        const normalized = (data.notifications || []).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));
        setNotifications(normalized);
      } catch (err) {
        console.error('Failed to load notifications', err);
        setNotifications([]);
      }
    };
    loadNotifications();
  }, [user, onRefresh]);

  useEffect(() => {
    const fetchTenantContext = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/me`, { cache: 'no-store' });
        if (!res.ok) {
          // If unauthorized or not found, clear membership and permissions
          setMembership(null);
          setCanViewSettings(false);
          setCanCreatePosts(false);
          return;
        }
        const data = await res.json();
        setMembership(data.membership || null);
        const perms = data.permissions || {};
        setCanViewSettings(Boolean(perms.isAdmin || perms.canApprove || perms.canBan || perms.canManagePrayer || perms.canManageResources || perms.canManageContact));
        setCanCreatePosts(Boolean(perms.canCreatePosts));
      } catch (err) {
        console.error('Error fetching tenant context:', err);
        setCanViewSettings(false);
        setCanCreatePosts(false);
      }
    };
    fetchTenantContext();
  }, [user, tenant]);

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
      if (!res.ok) {
        console.error('Failed to mark notification as read', res.status);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to mark all notifications as read', res.status);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };
  
  const handleNotificationNavigate = (link?: string) => {
    setIsNotificationPanelOpen(false);
    if (!link) return;
    if (link === 'messages') {
        onNavigateToMessages();
    }
    // Tenant navigation is already handled by being in the layout
  };
  
  const tenantDisplayName = membership?.displayName || user.profile.displayName;
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // If the user lands on the settings page without permission (e.g., from a stale URL), redirect them.
  if (currentPage === 'settings' && !canViewSettings) {
    setCurrentPage('home');
  }
  
  type NavItemFeature = keyof Omit<Tenant['settings'], 'isPublic' | 'membershipApprovalMode' | 'visitorVisibility' | 'donationSettings' | 'liveStreamSettings'>;

  const navItems: { key: TenantPage; label: string; feature?: NavItemFeature, adminOnly?: boolean }[] = [
    { key: 'home', label: 'Home' },
    { key: 'settings', label: 'Settings', adminOnly: true },
    { key: 'posts', label: 'Posts', feature: 'enablePosts' },
    { key: 'calendar', label: 'Calendar', feature: 'enableCalendar' },
    { key: 'volunteering', label: 'Volunteering', feature: 'enableVolunteering' },
    { key: 'smallGroups', label: 'Small Groups', feature: 'enableSmallGroups' },
    { key: 'liveStream', label: 'Live Stream', feature: 'enableLiveStream' },
    { key: 'prayerWall', label: 'Prayer Wall', feature: 'enablePrayerWall' },
    { key: 'resourceCenter', label: 'Resources', feature: 'enableResourceCenter' },
    { key: 'sermons', label: 'Sermons', feature: 'enableSermons' },
    { key: 'podcasts', label: 'Podcasts', feature: 'enablePodcasts' },
    { key: 'books', label: 'Books', feature: 'enableBooks' },
    { key: 'members', label: 'Members', feature: 'enableMemberDirectory' },
    { key: 'chat', label: 'Chat', feature: 'enableGroupChat' },
    { key: 'donations', label: 'Donations', feature: 'enableDonations' },
    { key: 'contact', label: 'Contact' },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage tenant={tenant} user={user} onNavigate={setCurrentPage} onRefresh={onRefresh} />;
      case 'settings':
         if (!canViewSettings) {
            return (
                 <div className="text-center bg-white p-12 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                    <p className="mt-2 text-gray-500">You do not have permission to view the control panel.</p>
                </div>
            )
        }
        return <ControlPanel tenant={tenant} onUpdate={onUpdateTenant} onSave={async (updates: any) => { onUpdateTenant({ ...tenant, ...updates }); return Promise.resolve(); }} currentUser={user} onImpersonate={onImpersonate} onRefresh={onRefresh} />;
      case 'posts':
        return <PostsPage tenant={tenant as any} user={user as any} posts={[]} canCreate={canCreatePosts} />;
      case 'calendar':
        return <EventsPage tenant={tenant} user={user} />;
      case 'members':
        return <MembersPage tenant={tenant} user={user as any} members={[]} onViewProfile={onViewProfile} />;
      case 'sermons':
        return <SermonsPage tenant={tenant} user={user as any} sermons={[]} canCreate={false} />;
      case 'podcasts':
        return <PodcastsPage tenant={tenant} user={user as any} podcasts={[]} canCreate={false} />;
      case 'books':
        return <BooksPage tenant={tenant} user={user as any} books={[]} canCreate={false} />;
      case 'chat':
        return <ChatPage tenant={tenant} user={user as any} onViewProfile={onViewProfile} />;
      case 'donations':
        return <DonationsPage tenant={tenant} user={user as any} onRefresh={onRefresh} />;
      case 'contact':
        return <ContactPage tenant={tenant} />;
      case 'volunteering':
        return <VolunteeringPage tenant={tenant} user={user as any} needs={[]} onRefresh={onRefresh} />;
      case 'smallGroups':
        return <SmallGroupsPage tenant={tenant} user={user as any} groups={[]} onRefresh={onRefresh} />;
      case 'liveStream':
        return <LiveStreamPage tenant={tenant} />;
      case 'prayerWall':
        return <PrayerWallPage tenant={tenant} user={user as any} onRefresh={onRefresh} />;
      case 'resourceCenter':
        return <ResourceCenterPage tenant={tenant} user={user as any} onRefresh={onRefresh} />;
      // Add other page components here as they are built
      default:
        return (
            <div className="text-center bg-white p-12 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold">{(currentPage as string).charAt(0).toUpperCase() + (currentPage as string).slice(1)}</h2>
                <p className="mt-2 text-gray-500">This feature is not yet implemented.</p>
            </div>
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                 <div className="flex items-center space-x-4">
                    {tenant.branding.logoUrl ? (
                         <img src={tenant.branding.logoUrl} alt={`${tenant.name} Logo`} className="h-8 w-auto" />
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="http://www.w3.org/2000/svg" fill="currentColor">
                            <path d="M12 2L1 9l4 2.18v6.32L12 22l7-4.5V11.18L23 9l-3-1.68V5h-2v1.32L12 2zm0 16.5l-5-3.25V11.4l5 2.75v5.6zM12 12L7 9.25 12 6.5 17 9.25 12 12z"/>
                         </svg>
                    )}
                    <h1 className="text-xl font-bold text-gray-800 hidden md:block">{tenant.name}</h1>
                 </div>
                 <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {user.isSuperAdmin && (
                            <Button variant="danger" size="sm" onClick={onNavigateToAdminConsole}>Admin Console</Button>
                        )}
                        <div className="relative">
                            <NotificationBell
                                unreadCount={unreadNotificationCount}
                                onClick={() => setIsNotificationPanelOpen(prev => !prev)}
                            />
                            {isNotificationPanelOpen && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onClose={() => setIsNotificationPanelOpen(false)}
                                    onMarkAsRead={handleMarkNotificationAsRead}
                                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                                    onNavigate={handleNotificationNavigate}
                                />
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                             <img src={user.profile.avatarUrl || '/placeholder-avatar.svg'} alt={user.profile.displayName} className="h-8 w-8 rounded-full"/>
                             <p className="font-semibold text-amber-700 text-sm hidden sm:block">{tenantDisplayName}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={onLogout}>Logout</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
                        <button onClick={onBackToSelect} className="hover:text-amber-700 hidden sm:block">
                            &larr; Switch Tenant
                        </button>
                        <button onClick={onNavigateToMessages} className="hover:text-amber-700">
                            Global Messages
                        </button>
                        <a href="/explore" className="hover:text-amber-700">
                            Explore
                        </a>
                    </div>
                 </div>
            </div>
             <nav className="-mb-px flex space-x-6 overflow-x-auto border-t border-gray-200">
                {navItems.map((item: any) => {
                    const isEnabled = !item.feature || (tenant.settings as any)[item.feature];
                    if (!isEnabled) return null;
                    if (item.adminOnly && !canViewSettings) return null;

                    return (
                        <button
                            key={item.key}
                            onClick={() => setCurrentPage(item.key)}
                            className={`${
                            currentPage === item.key
                                ? 'border-amber-500 text-amber-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </div>
      </header>
       <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default TenantLayout;