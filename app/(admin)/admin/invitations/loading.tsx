import { ListSkeleton, Skeleton } from '@/components/loading-skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-11 w-full max-w-xs" />
      <ListSkeleton rows={6} />
    </div>
  );
}
