"use client"

import React from 'react';
import type { Tenant, User, UserTenantMembership, TenantSettings, TenantBranding, UserProfile } from '@prisma/client';
import { EventWithCreator, MembershipStatus, MembershipApprovalMode } from '@/types';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useRouter } from 'next/navigation';
import TenantCarousel from '@/app/components/TenantCarousel';

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
          <h3 className="text-xl font-semibold text-red-800">Access Restricted</h3>
          <p className="mt-2 text-gray-600">You are currently banned from this community. Please contact an administrator for more information.</p>
        </div>
      );
    } else if (membership?.status === MembershipStatus.PENDING) {
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Request Sent</h3>
          <p className="mt-2 text-gray-600">Your membership request is pending approval from the administrators of {tenant.name}.</p>
          <Button disabled className="mt-4">Membership Pending</Button>
        </div>
      );
    } else {
      const isApprovalRequired = tenant.settings?.membershipApprovalMode === MembershipApprovalMode.APPROVAL_REQUIRED;
      joinContent = (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Join {tenant.name}</h3>
          <p className="mt-2 text-gray-600">{tenant.description}</p>
          <Button onClick={handleJoin} className="mt-6">
            {user ? (isApprovalRequired ? 'Request Membership' : 'Join Temple') : 'Login to Join'}
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
  const slides: Array<{ title: string; subtitle?: string; imageUrl?: string | null; logoUrl?: string | null; link?: string }> = [];

  recentPosts.forEach((p) => {
    slides.push({
      title: p.title,
      subtitle: `Post • ${new Date(p.publishedAt).toLocaleDateString()}`,
      imageUrl: undefined,
      logoUrl: undefined,
      // Link to the posts listing page instead of the individual post
      link: `/tenants/${tenant.id}/posts`,
    });
  });

  if (recentCommunity && recentCommunity.length > 0) {
    recentCommunity.forEach((c) => {
      slides.push({
        title: c.title || 'Community',
        subtitle: `Community • ${new Date(c.createdAt).toLocaleDateString()}`,
        imageUrl: undefined,
        logoUrl: undefined,
        link: `/tenants/${tenant.id}/community`,
      });
    });
  }

  if (services && services.length > 0) {
    services.forEach((s) => {
      slides.push({
        title: s.name,
        subtitle: s.description || 'Service',
        imageUrl: s.imageUrl || undefined,
        logoUrl: undefined,
        link: `/tenants/${tenant.id}/services`,
      });
    });
  }

  // Add recent photos
  (recentPhotos || []).forEach((ph) => {
    slides.push({
      title: ph.title || 'Photo',
      subtitle: `Photo • ${ph.uploadedAt ? new Date(ph.uploadedAt).toLocaleDateString() : ''}`,
      imageUrl: ph.storageKey ? `/storage/${ph.storageKey}` : undefined,
      logoUrl: undefined,
      link: `/tenants/${tenant.id}/photos`,
    });
  });

  // Add recent podcasts
  (recentPodcasts || []).forEach((pc) => {
    slides.push({
      title: pc.title,
      subtitle: `Podcast • ${pc.publishedAt ? new Date(pc.publishedAt).toLocaleDateString() : ''}`,
      imageUrl: pc.artworkUrl || undefined,
      logoUrl: undefined,
      link: `/tenants/${tenant.id}/podcasts`,
    });
  });

  // Add recent sermons
  (recentSermons || []).forEach((sr) => {
    slides.push({
      title: sr.title,
      subtitle: `Sermon • ${sr.publishedAt ? new Date(sr.publishedAt).toLocaleDateString() : ''}`,
      imageUrl: sr.artworkUrl || undefined,
      logoUrl: undefined,
      link: `/tenants/${tenant.id}/sermons`,
    });
  });

  // Add recent books
  (recentBooks || []).forEach((b) => {
    slides.push({
      title: b.title,
      subtitle: `Book${b.author ? ` • ${b.author}` : ''}`,
      imageUrl: undefined,
      logoUrl: undefined,
      link: `/tenants/${tenant.id}/books`,
    });
  });

  return (
    <div className="space-y-8">
      {isLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center space-x-4 cursor-pointer" onClick={() => router.push(`/tenants/${tenant.id}/live`)}>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse" aria-hidden="true"></span>
          <span className="font-bold text-lg">We’re Live! Click here to join.</span>
        </div>
      )}

      {/* Header Section */}
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-amber-100 to-amber-200">
            {tenant.branding?.bannerImageUrl && (
              <img 
                  src={tenant.branding.bannerImageUrl} 
                  alt={`${tenant.name} banner`} 
                  className="h-full w-full object-cover"
              />
            )}
        </div>
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end space-x-5">
                    <div className="flex-shrink-0">
                         <img 
                            src={tenant.branding?.logoUrl || '/placeholder-logo.svg'}
                            alt={`${tenant.name} logo`}
                            className="h-24 w-24 rounded-full bg-white p-1 shadow-md object-cover ring-4 ring-white -mt-16"
                        />
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <h2 className="text-2xl font-bold text-gray-900 truncate">{tenant.name}</h2>
                        <p className="text-sm font-medium text-gray-500">{tenant.creed}</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 flex-shrink-0">
                    {tenant.settings?.enableDonations && donationLink && (
                        <a href={donationLink.url} target="_blank" rel="noopener noreferrer">
                            <Button>
                                Donate
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
                <h3 className="text-xl font-semibold text-gray-800">Welcome, {tenantDisplayName}!</h3>
                <p className="mt-2 text-gray-600">
                    This is the central hub for {tenant.name}. Here you’ll find the latest announcements, upcoming events, and more. We’re glad you’re here.
                </p>
            </Card>

            {/* Recent Posts */}
             <Card className="!p-0">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold leading-6 text-gray-900">Recent Posts</h3>
                        <p className="mt-1 text-sm text-gray-500">The latest news and announcements.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('posts')}>View All</Button>
                </div>
                <ul className="divide-y divide-gray-200">
                    {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                        <li key={post.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(`posts/${post.id}`)}>
                            <div className="text-sm font-semibold text-gray-800">{post.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              By {post.author?.profile?.displayName ?? 'Unknown'} on {new Date(post.publishedAt).toLocaleDateString()}
                            </div>
                        </li>
                    )) : (
                        <li className="p-4 text-sm text-gray-500 text-center">No recent posts.</li>
                    )}
                </ul>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
             {/* Upcoming Events */}
            <Card className="!p-0">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold leading-6 text-gray-900">Upcoming Events</h3>
                        <p className="mt-1 text-sm text-gray-500">What’s happening soon.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('calendar')}>View Calendar</Button>
                </div>
                <ul className="divide-y divide-gray-200">
                   {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                        <li key={event.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(`calendar/${event.id}`)}>
                            <div className="font-semibold text-sm text-gray-800">{event.title}</div>
                            <div className="text-xs text-amber-700 mt-1">
                                {new Date(event.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                        </li>
                   )) : (
                        <li className="p-4 text-sm text-gray-500 text-center">No upcoming events.</li>
                   )}
                </ul>
            </Card>
        </div>
      </div>

      {/* Tenant-level carousel (inserted under existing content) */}
      <div>
        <TenantCarousel slides={slides.length > 0 ? slides : [{ title: tenant.name, subtitle: tenant.creed, imageUrl: tenant.branding?.bannerImageUrl || undefined, logoUrl: tenant.branding?.logoUrl || undefined, link: `/tenants/${tenant.id}` }]} />
      </div>

    </div>
  );
};
