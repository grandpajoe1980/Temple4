import { SkeletonPage } from '@/app/components/ui/LoadingSkeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonPage />
    </div>
  );
}
