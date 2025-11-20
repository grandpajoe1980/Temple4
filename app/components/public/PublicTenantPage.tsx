"use client"

import React, { useState, useMemo, useEffect } from 'react';
import type { Tenant, User, Notification } from '@/types';
import Button from '../ui/Button';
import PublicHeader from './PublicHeader';
import PublicPostsView from './PublicPostsView';
import PublicEventsView from './PublicEventsView';
import Tabs from '../ui/Tabs';
import SermonsPage from '../tenant/SermonsPage';
import PodcastsPage from '../tenant/PodcastsPage';
import BooksPage from '../tenant/BooksPage';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';



interface PublicTenantPageProps {
  tenant: any; // Legacy component with architectural issues
  currentUser: any | null;
  onBack: () => void;
  onJoin: (tenantId: string) => void;
  onNavigateToLogin: () => void;
  onGoToDashboard: () => void;
  onRefresh: () => void;
}

type PublicPage = 'posts' | 'calendar' | 'sermons' | 'podcasts' | 'books';

const PublicTenantPage: React.FC<PublicTenantPageProps> = ({ tenant, currentUser, onBack, onJoin, onNavigateToLogin, onGoToDashboard, onRefresh }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!currentUser) {
        setNotifications([]);
        return;
      }
      try {
        const res = await fetch('/api/notifications?limit=6', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        const normalized = (data.notifications || []).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));
        if (!isActive) return;
        setNotifications(normalized);
      } catch (e) {
        console.error(e);
        if (isActive) setNotifications([]);
      }
    };
    load();
    return () => { isActive = false; };
  }, [currentUser, onRefresh]);
  
  const availableTabs = useMemo(() => {
    const tabs: { key: PublicPage; label: string }[] = [];
    if (tenant.settings.visitorVisibility.posts) tabs.push({ key: 'posts', label: 'Posts' });
    if (tenant.settings.visitorVisibility.calendar) tabs.push({ key: 'calendar', label: 'Calendar' });
    if (tenant.settings.visitorVisibility.sermons) tabs.push({ key: 'sermons', label: 'Sermons' });
    if (tenant.settings.visitorVisibility.podcasts) tabs.push({ key: 'podcasts', label: 'Podcasts' });
    if (tenant.settings.visitorVisibility.books) tabs.push({ key: 'books', label: 'Books' });
    return tabs;
  }, [tenant.settings.visitorVisibility]);

  const [activeTab, setActiveTab] = useState<PublicPage>(availableTabs.length > 0 ? availableTabs[0].key : 'posts');

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleNotificationNavigate = (link?: string) => {
    setIsNotificationPanelOpen(false);
    // Basic navigation for now
    if (link?.startsWith('tenant/')) {
        const tenantId = link.split('/')[1];
        if (tenantId === tenant.id) {
            onGoToDashboard();
        }
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const renderContent = () => {
    // Note: These need to be public, read-only versions.
    // We can reuse some components if they don't contain member-only actions.
    switch (activeTab) {
      case 'posts':
        return <PublicPostsView tenant={tenant} />;
      case 'calendar':
        return <PublicEventsView tenant={tenant} />;
      case 'sermons':
        // TODO: Create proper public view components or fetch data here
        return <SermonsPage tenant={tenant} user={currentUser!} sermons={[]} canCreate={false} />;
       case 'podcasts':
        return <PodcastsPage tenant={tenant} user={currentUser!} podcasts={[]} canCreate={false} />;
       case 'books':
        return <BooksPage tenant={tenant} user={currentUser!} books={[]} canCreate={false} />;
      default:
        return <div>Content not available.</div>;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
       <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                   <Button variant="secondary" size="sm" onClick={onBack}>
                     &larr; Back to Explore
                   </Button>
               </div>
                <div className="flex items-center space-x-4">
                 {currentUser ? (
                     <>
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
                        <div className="text-right">
                           <p className="text-sm text-gray-500">Logged in as</p>
                           <p className="font-semibold text-amber-700">{currentUser.profile.displayName}</p>
                        </div>
                        <img src={currentUser.profile.avatarUrl || '/placeholder-avatar.svg'} alt="avatar" className="h-8 w-8 rounded-full" />
                     </>
                 ) : (
                    <Button variant="secondary" size="sm" onClick={onNavigateToLogin}>Login / Register</Button>
                 )}
               </div>
          </div>
        </header>

       <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
          <PublicHeader
            tenant={tenant}
            currentUser={currentUser}
            membership={null}
            onJoin={onJoin}
            onNavigateToLogin={onNavigateToLogin}
            onGoToDashboard={onGoToDashboard}
          />
          {availableTabs.length > 0 && (
             <div className="bg-white rounded-lg shadow-sm">
                 <div className="px-6 border-b border-gray-200">
                     <Tabs 
                        tabs={availableTabs.map(t => t.label)}
                        activeTab={availableTabs.find(t => t.key === activeTab)?.label || ''}
                        onTabClick={(label) => {
                            const tab = availableTabs.find(t => t.label === label);
                            if (tab) setActiveTab(tab.key);
                        }}
                     />
                 </div>
                 <div className="p-6">
                    {renderContent()}
                 </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicTenantPage;
