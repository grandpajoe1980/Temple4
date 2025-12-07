import { Skeleton } from '@/app/components/ui/LoadingSkeleton';

export default function ResetPasswordLoading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
          
          {/* Password fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          {/* Button */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
