'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Tenant page error:', error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Unable to Load Tenant
        </h2>
        <p className="text-gray-600 mb-6">
          We encountered an error while loading this temple’s content.
        </p>
        <div className="space-x-4">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/explore')}
            variant="secondary"
          >
            Browse Communities
          </Button>
        </div>
      </div>
    </div>
  );
}
