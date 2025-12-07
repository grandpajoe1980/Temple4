'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '@/app/components/ui/Button';

export default function TenantNotFound() {
  const params = useParams();
  const tenantId = params?.tenantId as string;

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4 bg-gray-100">
      <div className="text-center max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
        {/* 404 Icon/Number */}
        <div className="mb-6">
          <span className="text-7xl font-bold text-primary/20">404</span>
        </div>
        
        {/* Main Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          This page doesn't exist within this community.
          It may have been moved or removed.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 justify-center mb-6">
          {tenantId && (
            <Link href={`/tenants/${tenantId}`}>
              <Button variant="primary" className="w-full inline-flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Community Home
              </Button>
            </Link>
          )}
          <Link href="/explore">
            <Button variant="secondary" className="w-full inline-flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Explore Communities
            </Button>
          </Link>
        </div>
        
        {/* Back Link */}
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
