import { Skeleton } from "@/components/ui/skeleton";

export function QueuePageSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </section>
      <Skeleton className="h-24 w-full max-w-3xl rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
