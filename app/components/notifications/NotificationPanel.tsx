"use client"

import React from 'react';
import type { Notification } from '@/types';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-card shadow-2xl ring-1 ring-border focus:outline-none z-30"
      role="region"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-md font-semibold text-foreground">Notifications</h3>
          <p className="text-xs text-muted-foreground">Stay on top of approvals and updates</p>
          <button
            type="button"
            onClick={() => onNavigate?.('/notifications/mindfulness')}
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
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
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <ul className="py-1 max-h-96 overflow-y-auto" aria-label="Notification list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <li key={notification.id}>
              <article
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.message}, ${timeSince(notification.createdAt)}`}
                className={`flex items-start gap-3 px-4 py-3 text-sm text-foreground cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                  notification.isRead ? 'hover:bg-muted' : 'bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium'
                }`}
              >
                {!notification.isRead && (
                  <div className="mt-1.5 flex-shrink-0" aria-hidden="true">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  </div>
                )}

                {/* If the notification has an actor, show their avatar and name linked to profile */}
                {notification.actorUserId ? (
                  <div className={`flex items-center ${notification.isRead ? 'pl-4' : ''}`}>
                    <UserLink userId={notification.actorUserId} className="flex-shrink-0">
                      <Avatar src={notification.actorAvatarUrl ?? undefined} name={notification.actorDisplayName ?? undefined} size="sm" className="mr-3" />
                    </UserLink>
                    <div>
                      {notification.actorDisplayName ? (
                        <p className="text-foreground">
                          <UserLink userId={notification.actorUserId} className="font-semibold mr-1 inline-block text-foreground">
                            <span className="font-semibold">{notification.actorDisplayName}</span>
                          </UserLink>
                          <span className="ml-1">{notification.message}</span>
                        </p>
                      ) : (
                        <p className="text-foreground">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{timeSince(notification.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className={notification.isRead ? 'pl-4' : ''}>
                    <p className="text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeSince(notification.createdAt)}</p>
                  </div>
                )}
              </article>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            You have no notifications.
          </li>
        )}
      </ul>
    </div>
  );
};

export default NotificationPanel;
