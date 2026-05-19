import { CustomersTableSkeleton } from "./customers-table-skeleton";

export default function CustomersLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-4 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2 border-b border-[#E5E7EB] pb-4">
        <div className="h-7 w-40 animate-pulse rounded bg-[#E5E7EB]/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-[#E5E7EB]/50" />
      </div>
      <CustomersTableSkeleton />
    </div>
  );
}
