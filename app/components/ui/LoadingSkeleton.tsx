import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component for loading states.
 * Animates with a subtle pulse effect.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Text skeleton with typical text line height.
 */
export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

/**
 * Avatar skeleton - circular shape.
 */
export function SkeletonAvatar({ className = 'h-10 w-10' }: SkeletonProps) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

/**
 * Button skeleton - button-like shape.
 */
export function SkeletonButton({ className = 'h-10 w-24' }: SkeletonProps) {
  return <Skeleton className={`rounded-lg ${className}`} />;
}

/**
 * Card skeleton - for loading card-like content.
 */
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-2/3" />
      </div>
    </div>
  );
}

/**
 * Page skeleton - for full page loading states.
 */
export function SkeletonPage({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-6 p-6 ${className}`} aria-label="Loading content">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Content grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * Form skeleton - for loading form states.
 */
export function SkeletonForm({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`} aria-label="Loading form">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <SkeletonButton className="w-full h-12" />
    </div>
  );
}

/**
 * List skeleton - for loading list states.
 */
export function SkeletonList({ count = 3, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`space-y-4 ${className}`} aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-1/3" />
            <SkeletonText className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
