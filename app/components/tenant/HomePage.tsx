"use client"

import React, { useEffect, useState } from 'react';
import type { EventWithCreator, Tenant, User, UserTenantMembership } from '@/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { MembershipStatus, MembershipApprovalMode } from '@/types';
import useTranslation from '@/app/hooks/useTranslation';

type TenantPage = 'home' | 'settings' | 'posts' | 'calendar' | 'sermons' | 'podcasts' | 'books' | 'members' | 'chat' | 'donations' | 'contact' | 'volunteering' | 'smallGroups' | 'liveStream';

type PostListItem = {
  id: string;
  title: string;
  publishedAt: Date;
  author?: { profile?: { displayName?: string | null } | null } | null;
};

interface HomePageProps {
  tenant: Tenant;
  user: User;
  onNavigate: (page: TenantPage) => void;
  onRefresh: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ tenant, user, onNavigate, onRefresh }) => {
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';
  const [membership, setMembership] = useState<UserTenantMembership | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithCreator[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);

      const membershipResponse = await fetch(`/api/tenants/${tenant.id}/members/me`);

      if (!isMounted) return;

      if (membershipResponse.status === 401) {
        setMembership(null);
        setIsLoading(false);
        return;
      }

      const membershipPayload = await membershipResponse.json();
      const membershipData: UserTenantMembership | null = membershipPayload.membership ?? null;

      if (!isMounted) return;

      setMembership(membershipData);

      if (!membershipData || membershipData.status !== MembershipStatus.APPROVED) {
        setIsLoading(false);
        return;
      }

      const [eventsResponse, postsResponse] = await Promise.all([
        fetch(`/api/tenants/${tenant.id}/events`),
        fetch(`/api/tenants/${tenant.id}/posts?limit=3`),
      ]);

      const eventsData: EventWithCreator[] = await eventsResponse.json();
      const postsPayload: { posts?: Array<{ id: string; title: string; publishedAt?: string; createdAt?: string; author?: { profile?: { displayName?: string | null } | null } | null }> } = await postsResponse.json();

      if (!isMounted) return;

      const normalizedEvents = eventsData
        .map((event) => ({
          ...event,
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
        }))
        .filter((event) => event.startDateTime > new Date())
        .slice(0, 3);

      const normalizedPosts = (postsPayload.posts ?? [])
        .map<PostListItem>((post) => ({
          id: post.id,
          title: post.title,
          author: post.author ?? null,
          publishedAt: new Date(post.publishedAt ?? post.createdAt ?? new Date().toISOString()),
        }))
        .slice(0, 3);

      setUpcomingEvents(normalizedEvents);
      setRecentPosts(normalizedPosts);
      setIsLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tenant.id, user.id]);

  const handleJoin = async () => {
    await fetch(`/api/tenants/${tenant.id}/join`, { method: 'POST' });
    const updatedMembershipResponse = await fetch(`/api/tenants/${tenant.id}/members/me`);
    const updatedMembershipPayload = await updatedMembershipResponse.json();
    setMembership(updatedMembershipPayload.membership ?? null);
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <Card className="max-w-2xl w-full text-center">{t('common.loading')}</Card>
      </div>
    );
  }

  // If user is not an approved member, show a join/status view.
  if (!membership || membership.status !== MembershipStatus.APPROVED) {
    let joinContent;
    if (membership?.status === MembershipStatus.BANNED) {
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-800">{t('tenant.accessRestricted')}</h3>
          <p className="mt-2 text-gray-600">{t('tenant.bannedMessage')}</p>
        </div>
      );
    } else if (membership?.status === MembershipStatus.PENDING) {
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">{t('tenant.requestSent')}</h3>
          <p className="mt-2 text-gray-600">{t('tenant.pendingApproval', { name: tenant.name })}</p>
          <Button disabled className="mt-4">{t('tenant.membershipPending')}</Button>
        </div>
      );
    } else {
      const isApprovalRequired = tenant.settings.membershipApprovalMode === MembershipApprovalMode.APPROVAL_REQUIRED;
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">{t('tenant.join', { name: tenant.name })}</h3>
          <p className="mt-2 text-gray-600">{tenant.description}</p>
          <Button onClick={handleJoin} className="mt-6">
            {isApprovalRequired ? t('tenant.requestMembership') : t('tenant.joinCommunity')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid place-items-center">
        <Card className="max-w-2xl w-full">{joinContent}</Card>
      </div>
    );
  }

  const tenantDisplayName = membership?.displayName || user.profile?.displayName;
  const donationLink = tenant.branding.customLinks.find((link: any) => link.label.toLowerCase() === 'donate');
  const { enableLiveStream, liveStreamSettings } = tenant.settings;
  const isLive = enableLiveStream && liveStreamSettings.isLive;


  return (
    <div className="space-y-8">
      {isLive && (
        <div
          onClick={() => onNavigate('liveStream')}
          className="bg-red-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-red-700 transition-colors animate-pulse"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="font-bold text-lg">{t('tenant.liveNow')}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden overflow-x-hidden">
        <div className="h-48 tenant-bg-100 overflow-hidden">
          {tenant.branding.bannerImageUrl && (
            <img
              src={tenant.branding.bannerImageUrl}
              alt={`${tenant.name} banner`}
              className="h-full w-full object-contain object-left max-w-full"
            />
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="flex items-end space-x-5 min-w-0">
              <div className="flex-shrink-0">
                <img
                  src={tenant.branding.logoUrl || '/placeholder-logo.svg'}
                  alt={`${tenant.name} logo`}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white p-1 shadow-md object-cover ring-4 ring-white -mt-12 sm:-mt-16 max-w-full"
                />
              </div>
              <div className="mt-4 sm:mt-0 min-w-0 flex-1 pr-4 sm:pr-2">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 break-words leading-tight w-full">{tenant.name}</h2>
                <p className="text-sm font-medium text-gray-500 whitespace-normal break-words">{tenant.creed}</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex-shrink-0">
              {tenant.settings.enableDonations && donationLink && (
                <a href={donationLink.url} target="_blank" rel="noopener noreferrer">
                  <Button>
                    {t('tenant.donate')}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Message */}
          <Card>
            <h3 className="text-xl font-semibold text-gray-800">{t('tenant.welcomeUser', { name: tenantDisplayName || t('common.anonymous') })}</h3>
            <p className="mt-2 text-gray-600">
              {t('tenant.welcomeMessage', { name: tenant.name })}
            </p>
          </Card>

          {/* Recent Posts */}
          <Card className="!p-0">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900">{t('tenant.recentPosts')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('tenant.recentPostsDesc')}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('posts')}>{t('common.viewAll')}</Button>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                <li key={post.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm font-semibold text-gray-800">{post.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('tenant.byAuthorOn', { author: post.authorDisplayName || t('common.anonymous'), date: post.publishedAt.toLocaleDateString(localeCode) })}
                  </div>
                </li>
              )) : (
                <li className="p-4 text-sm text-gray-500 text-center">{t('tenant.noRecentPosts')}</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {/* Upcoming Events */}
          <Card className="!p-0">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900">{t('tenant.upcomingEvents')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('tenant.upcomingEventsDesc')}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('calendar')}>{t('tenant.viewCalendar')}</Button>
            </div>
            <ul className="divide-y divide-gray-200">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                <li key={event.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="font-semibold text-sm text-gray-800">{event.title}</div>
                  <div className="text-xs tenant-text-primary mt-1">
                    {event.startDateTime.toLocaleDateString(localeCode, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </li>
              )) : (
                <li className="p-4 text-sm text-gray-500 text-center">{t('tenant.noUpcomingEvents')}</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
