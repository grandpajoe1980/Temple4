'use client';

import { useRouter } from 'next/navigation';
import type { Notification } from '@/types';
import NotificationPanel from '../components/notifications/NotificationPanel';

interface NotificationsPageClientProps {
  notifications: Notification[];
  userId: string;
}

export default function NotificationsPageClient({ notifications, userId }: NotificationsPageClientProps) {
  const router = useRouter();

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNavigate = (link?: string) => {
    if (link) {
      router.push(link);
    }
  };

  const handleClose = () => {
    // On the notifications page, close doesn't need to do anything
    // since we're on a dedicated page
  };

  return (
    <NotificationPanel
      notifications={notifications}
      onClose={handleClose}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onNavigate={handleNavigate}
    />
  );
}
