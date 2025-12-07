import { SkeletonForm } from '@/app/components/ui/LoadingSkeleton';
import { Skeleton } from '@/app/components/ui/LoadingSkeleton';

export default function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 space-y-6 shadow-sm">
          {/* Logo placeholder */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          {/* Form fields */}
          <SkeletonForm />
        </div>
      </div>
    </div>
  );
}
