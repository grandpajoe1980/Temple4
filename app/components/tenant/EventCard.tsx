"use client"

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventWithCreator } from '@/types';
import { RSVPStatus } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';
import useTranslation from '@/app/hooks/useTranslation';

interface EventCardProps {
  event: EventWithCreator & { kind?: 'event' | 'trip' | 'birthday'; tripId?: string; birthdayUserId?: string; isAllDay?: boolean };
  currentUserId?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, currentUserId }) => {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const kind = (event as any).kind;
  const isTrip = kind === 'trip';
  const isBirthday = kind === 'birthday';
  const isNonRsvp = isTrip || isBirthday;
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(event.currentUserRsvpStatus ?? null);
  const [rsvpCount, setRsvpCount] = useState<number>(event.rsvpCount ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get locale code for date formatting
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';

  const formatDateTime = (start: Date, end: Date) => {
    const startDate = start.toLocaleDateString(localeCode, { weekday: 'long', month: 'long', day: 'numeric' });
    if (event.isAllDay || isBirthday) {
      return startDate;
    }
    const startTime = start.toLocaleTimeString(localeCode, { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = end.toLocaleTimeString(localeCode, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startDate} ${t('events.from')} ${startTime} ${t('events.to')} ${endTime}`;
  };

  const currentStatusLabel = useMemo(() => {
    if (!rsvpStatus || rsvpStatus === 'NOT_GOING') return null;
    return rsvpStatus === 'GOING' ? t('events.youAreGoing') : t('events.interested');
  }, [rsvpStatus, t]);

  const applyRsvpCount = (nextStatus: RSVPStatus, previousStatus: RSVPStatus | null, count: number) => {
    const wasCounting = previousStatus === 'GOING' || previousStatus === 'INTERESTED';
    const willCount = nextStatus === 'GOING' || nextStatus === 'INTERESTED';

    if (wasCounting === willCount) return count;
    if (willCount && !wasCounting) return count + 1;
    if (!willCount && wasCounting) return Math.max(0, count - 1);
    return count;
  };

  const handleRsvp = async (status: RSVPStatus) => {
    if (isNonRsvp) return; // RSVPs not enabled for trips/birthdays via calendar
    if (!currentUserId) {
      router.push('/auth/login');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tenants/${event.tenantId}/events/${event.id}/rsvps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      setRsvpCount((current) => applyRsvpCount(status, rsvpStatus, current));
      setRsvpStatus(status);
    } catch (error) {
      console.error('RSVP update failed', error);
      alert(t('events.rsvpError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const LocationInfo = () => {
    if (event.isOnline) {
      return (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
            <path d="M2 12.5a.5.5 0 01.5-.5h15a.5.5 0 010 1h-15a.5.5 0 01-.5-.5z" />
          </svg>
          {t('events.virtualEvent')}
        </>
      );
    }
    return (
      <>
        <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        {event.locationText}
      </>
    );
  };

  const Description = () => {
    if (event.isOnline && event.onlineUrl) {
      return (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--primary)' }}>
            {event.description} ({t('events.clickToJoin')})
          </a>
        </p>
      );
    }
    return (
      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
        {event.description}
      </p>
    );
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          {formatDateTime(event.startDateTime, event.endDateTime)}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900 cursor-pointer" style={{ '--tw-text-opacity': 1 } as any}>
          {event.title}
        </h3>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <LocationInfo />
        </div>
        <Description />
      </div>
      {!isNonRsvp ? (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant={rsvpStatus === 'GOING' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRsvp(RSVPStatus.GOING)}
            >
              {rsvpStatus === 'GOING' ? `${t('events.going')} ✓` : t('events.going')}
            </Button>
            <Button
              variant={rsvpStatus === 'INTERESTED' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRsvp(RSVPStatus.INTERESTED)}
            >
              {rsvpStatus === 'INTERESTED' ? `${t('events.interested')} ✓` : t('events.interested')}
            </Button>
            <Button
              variant={rsvpStatus === 'NOT_GOING' ? 'primary' : 'ghost'}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRsvp(RSVPStatus.NOT_GOING)}
            >
              {t('events.notGoing')}
            </Button>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div className="font-semibold text-gray-900">{rsvpCount} {rsvpCount === 1 ? t('events.rsvp') : t('events.rsvps')}</div>
            <div className="text-gray-500">{currentStatusLabel || t('events.updateStatus')}</div>
            <div className="text-[11px] text-gray-400">
              {t('events.createdBy')}{' '}
              <UserLink userId={(event as any).createdByUserId} className="inline-flex items-center text-gray-700">
                <Avatar src={event.creatorAvatarUrl ?? undefined} name={event.creatorDisplayName} size="xs" className="mr-2" />
                <span className="text-[11px]">{event.creatorDisplayName}</span>
              </UserLink>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-600 flex items-center justify-between">
          <div className="text-gray-500">
            {isTrip ? t('events.trip') : t('events.birthday')} •{' '}
            <UserLink userId={(event as any).createdByUserId} className="inline-flex items-center text-gray-700">
              <Avatar src={event.creatorAvatarUrl ?? undefined} name={event.creatorDisplayName} size="xs" className="mr-2" />
              <span className="text-sm">{event.creatorDisplayName}</span>
            </UserLink>
          </div>
          <div className="text-gray-500">{isTrip ? `${t('events.members')}: ${rsvpCount}` : t('events.allDay')}</div>
        </div>
      )}
    </Card>
  );
};

export default EventCard;
