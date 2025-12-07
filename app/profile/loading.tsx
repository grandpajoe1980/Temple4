import { Skeleton, SkeletonCard } from '@/app/components/ui/LoadingSkeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
