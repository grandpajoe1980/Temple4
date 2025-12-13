"use client"

import React from 'react';
import type { Tenant, User, UserTenantMembership, TenantSettings, TenantBranding, UserProfile } from '@prisma/client';
import { EventWithCreator, MembershipStatus, MembershipApprovalMode } from '@/types';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useRouter } from 'next/navigation';
import TenantCarousel from '@/app/components/TenantCarousel';
import useTranslation from '@/app/hooks/useTranslation';

interface HomePagePost {
  id: string;
  title: string;
  publishedAt: Date;
  author: { profile: UserProfile | null } | null;
}

interface CommunityPostItem {
  id: string;
  title: string;
  body?: string;
  createdAt: Date;
  author?: { profile: UserProfile | null } | null;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
}

interface HomePageClientProps {
  tenant: Tenant & { settings: TenantSettings | null; branding: TenantBranding | null; };
  user: (User & { profile: UserProfile | null }) | null;
  membership: UserTenantMembership | null;
  upcomingEvents: EventWithCreator[];
  recentPosts: HomePagePost[];
  recentCommunity: CommunityPostItem[];
  services: ServiceItem[];
  recentPhotos?: Array<{ id: string; storageKey?: string | null; title?: string; uploadedAt?: string | Date; authorDisplayName?: string | null }>;
  recentPodcasts?: Array<{ id: string; title: string; publishedAt?: string | Date; embedUrl?: string; artworkUrl?: string | null }>;
  recentSermons?: Array<{ id: string; title: string; publishedAt?: string | Date; embedUrl?: string; artworkUrl?: string | null }>;
  recentBooks?: Array<{ id: string; title: string; author?: string | null }>;
}

export default function HomePageClient({ tenant, user, membership, upcomingEvents, recentPosts, recentCommunity, services, recentPhotos, recentPodcasts, recentSermons, recentBooks }: HomePageClientProps) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth/login?callbackUrl=/tenants/${tenant.id}`);
      return;
    }
    await fetch(`/api/tenants/${tenant.id}/join`, { method: 'POST' });
    router.refresh();
  };

  const onNavigate = (path: string) => {
    router.push(`/tenants/${tenant.id}/${path}`);
  }

  // If user is not logged in or not an approved member, show a join/status view.
  if (!user || !membership || membership.status !== MembershipStatus.APPROVED) {
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
      const isApprovalRequired = tenant.settings?.membershipApprovalMode === MembershipApprovalMode.APPROVAL_REQUIRED;
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">{t('tenant.join', { name: tenant.name })}</h3>
          <p className="mt-2 text-gray-600">{tenant.description}</p>
          <Button onClick={handleJoin} className="mt-6">
            {user ? (isApprovalRequired ? t('tenant.requestMembership') : t('tenant.joinCommunity')) : t('auth.loginToJoin')}
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
  const customLinks = tenant.branding?.customLinks as { label: string, url: string }[] | undefined;
  const donationLink = customLinks?.find((link: any) => link.label.toLowerCase() === 'donate');
  const liveStreamSettings = tenant.settings?.liveStreamSettings as { isLive: boolean } | undefined;
  const isLive = tenant.settings?.enableLiveStream && liveStreamSettings?.isLive;


  // Build carousel slides: content sections (posts), community posts, services
  const slides: Array<{ title: string; subtitle?: string; description?: string; imageUrl?: string | null; logoUrl?: string | null; link?: string; category?: 'photo' | 'podcast' | 'sermon' | 'book' | 'service' | 'event' | 'post' | 'community' }> = [];

  recentPosts.forEach((p) => {
    slides.push({
      title: p.title,
      subtitle: `${t('carousel.post')} • ${new Date(p.publishedAt).toLocaleDateString(localeCode)}`,
      description: p.author?.profile?.displayName ? t('tenant.byAuthorOn', { author: p.author.profile.displayName, date: '' }).replace(` ${t('common.on')} `, '') : undefined,
      imageUrl: undefined,
      logoUrl: undefined,
      category: 'post',
      // Link to the posts listing page instead of the individual post
      link: `/tenants/${tenant.id}/posts`,
    });
  });

  if (recentCommunity && recentCommunity.length > 0) {
    recentCommunity.forEach((c) => {
      slides.push({
        title: c.title || 'Community',
        subtitle: `Community • ${new Date(c.createdAt).toLocaleDateString()}`,
        description: c.body ? c.body.substring(0, 100) + (c.body.length > 100 ? '...' : '') : (c.author?.profile?.displayName ? `By ${c.author.profile.displayName}` : undefined),
        imageUrl: undefined,
        logoUrl: undefined,
        category: 'community',
        link: `/tenants/${tenant.id}/community`,
      });
    });
  }

  if (services && services.length > 0) {
    services.forEach((s) => {
      slides.push({
        title: s.name,
        subtitle: 'Service',
        description: s.description || undefined,
        imageUrl: s.imageUrl || undefined,
        logoUrl: undefined,
        category: 'service',
        link: `/tenants/${tenant.id}/services`,
      });
    });
  }

  // Add recent photos
  (recentPhotos || []).forEach((ph) => {
    // Handle both Imgbb URLs (starting with http) and local storage paths
    const photoUrl = ph.storageKey?.startsWith('http') ? ph.storageKey : (ph.storageKey ? `/storage/${ph.storageKey}` : undefined);
    slides.push({
      title: ph.title || 'Photo',
      subtitle: `Photo • ${ph.uploadedAt ? new Date(ph.uploadedAt).toLocaleDateString() : ''}`,
      description: ph.authorDisplayName ? `By ${ph.authorDisplayName}` : undefined,
      imageUrl: photoUrl,
      logoUrl: undefined,
      category: 'photo',
      link: `/tenants/${tenant.id}/photos`,
    });
  });

  // Add recent podcasts
  (recentPodcasts || []).forEach((pc) => {
    slides.push({
      title: pc.title,
      subtitle: `Podcast • ${pc.publishedAt ? new Date(pc.publishedAt).toLocaleDateString() : ''}`,
      description: 'Listen to this episode',
      imageUrl: pc.artworkUrl || undefined,
      logoUrl: undefined,
      category: 'podcast',
      link: `/tenants/${tenant.id}/podcasts`,
    });
  });

  // Add recent sermons
  (recentSermons || []).forEach((sr) => {
    slides.push({
      title: sr.title,
      subtitle: `Sermon • ${sr.publishedAt ? new Date(sr.publishedAt).toLocaleDateString() : ''}`,
      description: 'Watch or listen to this sermon',
      imageUrl: sr.artworkUrl || undefined,
      logoUrl: undefined,
      category: 'sermon',
      link: `/tenants/${tenant.id}/sermons`,
    });
  });

  // Add recent books
  (recentBooks || []).forEach((b) => {
    slides.push({
      title: b.title,
      subtitle: 'Book',
      description: b.author ? `By ${b.author}` : 'Recommended reading',
      imageUrl: undefined,
      logoUrl: undefined,
      category: 'book',
      link: `/tenants/${tenant.id}/books`,
    });
  });

  return (
    <div className="space-y-8">
      {isLive && (
        <div
          className="rounded-md p-4 flex items-center space-x-4 cursor-pointer"
          onClick={() => router.push(`/tenants/${tenant.id}/live`)}
          style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)', border: '1px solid', borderColor: 'rgba(var(--primary-rgb), 0.20)' }}
        >
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse" aria-hidden="true"></span>
          <span className="font-bold text-lg">{t('tenant.liveNow')}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden overflow-x-hidden">
        <div className="h-48 tenant-bg-100 overflow-hidden">
          {tenant.branding?.bannerImageUrl && (
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
                  src={tenant.branding?.logoUrl || '/placeholder-logo.svg'}
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
              {tenant.settings?.enableDonations && donationLink && (
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
                <li key={post.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(`posts/${post.id}`)}>
                  <div className="text-sm font-semibold text-gray-800">{post.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('tenant.byAuthorOn', { author: post.author?.profile?.displayName ?? t('common.anonymous'), date: new Date(post.publishedAt).toLocaleDateString(localeCode) })}
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
                <li key={event.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(`calendar/${event.id}`)}>
                  <div className="font-semibold text-sm text-gray-800">{event.title}</div>
                  <div className="text-xs tenant-text-primary mt-1">
                    {new Date(event.startDateTime).toLocaleDateString(localeCode, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </li>
              )) : (
                <li className="p-4 text-sm text-gray-500 text-center">{t('tenant.noUpcomingEvents')}</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Tenant-level carousel (inserted under existing content) */}
      <div>
        <TenantCarousel slides={slides.length > 0 ? slides : [{ title: tenant.name, subtitle: tenant.creed || 'Welcome to our community', description: tenant.description || undefined, imageUrl: tenant.branding?.bannerImageUrl || undefined, logoUrl: tenant.branding?.logoUrl || undefined, link: `/tenants/${tenant.id}` }]} />
      </div>

    </div>
  );
};
