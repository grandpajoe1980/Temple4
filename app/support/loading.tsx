import { Skeleton, SkeletonCard } from '@/app/components/ui/LoadingSkeleton';

export default function SupportLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>
      
      {/* Support options grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      
      {/* FAQ section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
