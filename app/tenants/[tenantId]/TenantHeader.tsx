'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface TenantHeaderProps {
  tenantId: string;
  tenantName?: string;
  logoUrl?: string | null;
  canViewSettings: boolean;
}

export default function TenantHeader({ tenantId, tenantName, logoUrl, canViewSettings }: TenantHeaderProps) {
  const [open, setOpen] = useState(false);
  const basePath = `/tenants/${tenantId}`;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Open menu"
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <Link href={basePath} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Explore
            </Link>
            {canViewSettings && (
              <Link href={`${basePath}/settings`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Settings
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
