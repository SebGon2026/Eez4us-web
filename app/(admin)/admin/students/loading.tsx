import { ListSkeleton, Skeleton } from '@/components/loading-skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-full max-w-sm" />
        <Skeleton className="h-11 w-48" />
      </div>
      <ListSkeleton rows={6} />
    </div>
  );
}
