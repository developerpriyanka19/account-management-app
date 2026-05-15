import { Skeleton } from "@/components/ui/skeleton";

export function CustomersTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 min-w-[12rem] flex-1" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <Skeleton className="h-9 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
