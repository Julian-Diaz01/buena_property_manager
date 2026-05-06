import { Skeleton } from "@/components/ui/skeleton";

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-22 rounded-xl" />
        <Skeleton className="h-22 rounded-xl" />
        <Skeleton className="h-22 rounded-xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="mb-4 h-5 w-44" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
