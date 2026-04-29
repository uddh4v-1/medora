import { Loader2 } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-brand" />
    </div>
  );
}
