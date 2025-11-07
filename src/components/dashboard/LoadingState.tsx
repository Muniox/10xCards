import { Skeleton } from "@/components/ui/skeleton";

/**
 * LoadingState Component
 *
 * Displays skeleton loaders while statistics data is being fetched.
 * Mimics the layout of actual statistics cards for better UX.
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <LoadingState />;
 * }
 * ```
 */
export function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Generate 6 skeleton cards */}
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-3 flex-1">
              {/* Icon skeleton */}
              <Skeleton className="h-5 w-5" />
              {/* Title skeleton */}
              <Skeleton className="h-4 w-32" />
              {/* Value skeleton */}
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
