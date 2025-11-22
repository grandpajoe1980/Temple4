"use client"

import Link from 'next/link';
import React from 'react';

type ContentKey = 'Photos' | 'Podcasts' | 'Sermons' | 'Books' | 'Live Stream' | string;

export default function ContentChips({ tenantId, active }: { tenantId: string; active?: ContentKey }) {
  const chips: Array<{ href: string; label: ContentKey }> = [
    { href: `/tenants/${tenantId}/photos`, label: 'Photos' },
    { href: `/tenants/${tenantId}/podcasts`, label: 'Podcasts' },
    { href: `/tenants/${tenantId}/sermons`, label: 'Sermons' },
    { href: `/tenants/${tenantId}/books`, label: 'Books' },
    { href: `/tenants/${tenantId}/livestream`, label: 'Live Stream' },
  ];

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3">
            {chips.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${{
                  true: 'border-amber-500 bg-amber-100 text-amber-800',
                }[String(active === c.label)] ?? 'border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'}`}
                aria-current={active === c.label ? 'page' : undefined}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="h-14" />
    </>
  );
}
