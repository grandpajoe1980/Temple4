"use client"

import React from 'react';

type SubheaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** CSS height for the header spacer (e.g. '3.5rem') */
  height?: string;
  /** Optional CSS top offset. If omitted, it uses the site + tenant nav CSS variables. */
  topOffset?: string;
  /** Optional extra classname for the inner container */
  className?: string;
  /** Optional aria-label for the header */
  ariaLabel?: string;
};

export default function Subheader({
  title,
  subtitle,
  actions,
  height = '3.5rem',
  topOffset,
  className = '',
  ariaLabel,
}: SubheaderProps) {
  const top = topOffset ?? 'calc(var(--site-header-height, 4.5rem) + var(--tenant-nav-height, 6rem))';

  // Expose both the legacy `--community-header-height` and a generic `--subheader-height`
  // so existing code reading either variable keeps working after this refactor.
  const style = {
    top,
    ['--subheader-height' as any]: height,
    ['--community-header-height' as any]: height,
  } as React.CSSProperties;

  return (
    <>
      <div className="fixed left-0 right-0" style={style}>
        <div className={`bg-white border-b border-gray-200 ${className}`} aria-label={ariaLabel}>
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
    </>
  );
}
