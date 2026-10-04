import { TableSkeleton } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';

/** Shown instantly while a dashboard route's code loads: navigation never feels frozen. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TableSkeleton />
    </div>
  );
}
