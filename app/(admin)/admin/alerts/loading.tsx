import { ListSkeleton, Skeleton } from '@/components/loading-skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}
