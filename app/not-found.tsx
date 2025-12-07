'use client';

import Link from 'next/link';
import { Home, Search, HelpCircle, ArrowLeft } from 'lucide-react';
import Button from './components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Icon/Number */}
        <div className="mb-6">
          <span className="text-8xl font-bold text-primary/20">404</span>
        </div>
        
        {/* Main Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link href="/">
            <Button variant="primary" className="w-full sm:w-auto inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary" className="w-full sm:w-auto inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              Explore
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="ghost" className="w-full sm:w-auto inline-flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Get Help
            </Button>
          </Link>
        </div>
        
        {/* Back Link */}
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
