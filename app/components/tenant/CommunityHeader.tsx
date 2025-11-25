"use client"

import React from 'react';

export default function CommunityHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  // Position directly under the site header + tenant nav. Use tenant nav height CSS variable.
  const topStyle = { top: 'calc(var(--site-header-height) + var(--tenant-nav-height))' } as React.CSSProperties;

  // Use a fixed position so the header remains visible regardless of scroll container.
  // Expose a CSS variable for the community header height so we can reserve space.
  const communityHeaderVars = { ...topStyle, ['--community-header-height' as any]: '3.5rem' } as React.CSSProperties;

  return (
    <>
      <div className="fixed left-0 right-0 z-20" style={communityHeaderVars}>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="leading-tight">
                  <div className="text-2xl font-bold text-gray-900">{title}</div>
                  {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
                </div>
              </div>
              {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden style={{ height: 'var(--community-header-height)' }} />
    </>
  );
}
