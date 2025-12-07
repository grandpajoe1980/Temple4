import { Skeleton } from '@/app/components/ui/LoadingSkeleton';

export default function ForgotPasswordLoading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Button */}
          <Skeleton className="h-12 w-full rounded-lg" />
          
          {/* Back link */}
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}
