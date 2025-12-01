"use client"

import React from 'react';
import type { Notification } from '@/types';
import Button from '../ui/Button';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (link?: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) => {
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      onNavigate(notification.link);
    }
  };

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  }

  return (
    <div
      className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-30"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <div>
          <h3 className="text-md font-semibold text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-500">Stay on top of approvals and updates</p>
          <button
            type="button"
            onClick={() => onNavigate?.('/notifications/mindfulness')}
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"
          >
            Mindfulness bell
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Close notifications"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.3 5.3 5.3 6.3 10.9 12l-5.6 5.7 1 1 5.7-5.6 5.7 5.6 1-1-5.6-5.7 5.6-5.7-1-1-5.7 5.6z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="py-1 max-h-96 overflow-y-auto" role="none">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 px-4 py-3 text-sm text-gray-700 cursor-pointer transition-colors ${
                notification.isRead ? 'hover:bg-gray-50' : 'bg-amber-50 hover:bg-amber-100'
              }`}
            >
              {!notification.isRead && (
                 <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0"></div>
              )}
              <div className={notification.isRead ? 'pl-4' : ''}>
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeSince(notification.createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            You have no notifications.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
