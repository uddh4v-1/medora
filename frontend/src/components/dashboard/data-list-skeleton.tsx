import { Skeleton } from "@/components/ui/skeleton";

export function DataListSkeleton({
  rows = 5,
  showSearch = true,
  showPageTitle = true,
}: {
  rows?: number;
  showSearch?: boolean;
  showPageTitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {showPageTitle ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48 max-w-sm" />
        </div>
      ) : null}
      {showSearch ? (
        <div className="max-w-md">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="space-y-0 border-b border-border/50 bg-muted/30 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <ul className="divide-y divide-border/40">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-4 w-[28%] min-w-0 flex-1" />
              <Skeleton className="h-4 w-[22%] min-w-0 flex-1" />
              <Skeleton className="h-4 w-[18%] min-w-0" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
