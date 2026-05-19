import { Suspense } from "react";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import {
  GST_CUSTOMERS_PAGE_SIZE,
  gstCustomerListWhere,
  toGstCustomerRow,
} from "@/lib/gst-customer";
import { CustomersManagementListing } from "@/components/customer/customers-management-listing";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

async function CustomersManagementContent({ searchParams }: PageProps) {
  const { q, page: pageRaw } = await searchParams;
  const query = (q ?? "").trim();
  const where = gstCustomerListWhere(query);

  const totalFiltered = await gstCustomerDb().count({ where });
  const totalPages = Math.max(1, Math.ceil(totalFiltered / GST_CUSTOMERS_PAGE_SIZE));
  const rawPage = Number(pageRaw);
  const pageNum =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const page = Math.min(pageNum, totalPages);

  const rows = await gstCustomerDb().findMany({
    where,
    orderBy: { id: "desc" },
    skip: (page - 1) * GST_CUSTOMERS_PAGE_SIZE,
    take: GST_CUSTOMERS_PAGE_SIZE,
  });

  const customers = rows.map(toGstCustomerRow);
  const start = totalFiltered === 0 ? 0 : (page - 1) * GST_CUSTOMERS_PAGE_SIZE + 1;
  const end = Math.min(page * GST_CUSTOMERS_PAGE_SIZE, totalFiltered);

  return (
    <CustomersManagementListing
      customers={customers}
      totalFiltered={totalFiltered}
      query={query}
      page={page}
      totalPages={totalPages}
      start={start}
      end={end}
    />
  );
}

function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default async function CustomersManagementPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-[#D1D5DB] pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">Manage customer and GST details</p>
      </header>

      <Suspense fallback={<ListingSkeleton />}>
        <CustomersManagementContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
