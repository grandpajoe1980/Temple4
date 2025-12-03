'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SiteSection {
  title: string;
  items: { label: string; path: string; description?: string }[];
}

export default function SitemapPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const basePath = `/tenants/${tenantId}`;

  const sections: SiteSection[] = [
    {
      title: 'Main Pages',
      items: [
        { label: 'Home', path: '', description: 'Tenant homepage' },
        { label: 'Content', path: '/content', description: 'Content hub' },
        { label: 'Community', path: '/community', description: 'Community hub' },
        { label: 'Contact Us', path: '/contact', description: 'Contact form and information' },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Photos', path: '/photos', description: 'Photo galleries' },
        { label: 'Podcasts', path: '/podcasts', description: 'Podcast episodes' },
        { label: 'Sermons', path: '/sermons', description: 'Sermon library' },
        { label: 'Books', path: '/books', description: 'Book recommendations' },
        { label: 'Live Stream', path: '/livestream', description: 'Live streaming' },
      ],
    },
    {
      title: 'Community',
      items: [
        { label: 'Events', path: '/events', description: 'Upcoming and past events' },
        { label: 'Posts', path: '/posts', description: 'Community posts' },
        { label: 'Community Wall', path: '/community/wall', description: 'Community feed' },
        { label: 'Calendar', path: '/calendar', description: 'Event calendar' },
        { label: 'Prayer Wall', path: '/prayer-wall', description: 'Prayer requests' },
        { label: 'Memorials', path: '/memorials', description: 'In memoriam pages' },
        { label: 'Members', path: '/members', description: 'Member directory' },
        { label: 'Staff', path: '/staff', description: 'Staff directory' },
        { label: 'Chat', path: '/chat', description: 'Group chat' },
        { label: 'Small Groups', path: '/small-groups', description: 'Small group ministry' },
        { label: 'Trips', path: '/trips', description: 'Mission trips and travel' },
        { label: 'Volunteering', path: '/volunteering', description: 'Volunteer opportunities' },
        { label: 'Resources', path: '/resources', description: 'Resource center' },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'All Services', path: '/services', description: 'Service offerings' },
        { label: 'Ceremonies', path: '/services?category=CEREMONY', description: 'Weddings, funerals, baptisms' },
        { label: 'Education', path: '/services?category=EDUCATION', description: 'Classes and courses' },
        { label: 'Counseling', path: '/services?category=COUNSELING', description: 'Pastoral care' },
        { label: 'Facilities', path: '/services?category=FACILITY', description: 'Space rentals' },
        { label: 'Other', path: '/services?category=OTHER', description: 'Community services' },
      ],
    },
    {
      title: 'Donations',
      items: [
        { label: 'Give Now', path: '/donations', description: 'Make a donation' },
        { label: 'Funds', path: '/donations/funds', description: 'View fund goals' },
        { label: 'My Pledges', path: '/donations/pledges', description: 'Manage your pledges' },
      ],
    },
    {
      title: 'Admin - Community',
      items: [
        { label: 'Workboard', path: '/admin/workboard', description: 'Task management and todos' },
        { label: 'Support Tickets', path: '/admin/tickets', description: 'Ticketing system' },
      ],
    },
    {
      title: 'Admin - Settings',
      items: [
        { label: 'General Settings', path: '/settings', description: 'Tenant configuration' },
        { label: 'Member Notes', path: '/admin/member-notes', description: 'Staff notes about members' },
        { label: 'Assets', path: '/admin/assets', description: 'Asset management' },
        { label: 'Memorials Admin', path: '/admin/memorials', description: 'Manage memorial submissions' },
        { label: 'Pledges Admin', path: '/admin/pledges', description: 'Manage recurring pledges' },
        { label: 'Localization', path: '/admin/localization', description: 'Language and translation settings' },
        { label: 'Vanity Domains', path: '/admin/vanity-domains', description: 'Custom domain configuration' },
        { label: 'Site Map', path: '/admin/sitemap', description: 'This page - all site links' },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Site Map</h1>
        <p className="mt-2 text-gray-600">
          A complete listing of all pages available in this tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link
                    href={`${basePath}${item.path}`}
                    className="group block"
                  >
                    <span className="text-amber-600 group-hover:text-amber-700 font-medium">
                      {item.label}
                    </span>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="flex flex-wrap gap-2">
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <Link
                key={`${section.title}-${item.path}`}
                href={`${basePath}${item.path}`}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-amber-300 hover:text-amber-700"
              >
                {item.label}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
