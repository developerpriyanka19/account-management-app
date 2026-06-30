import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { DashboardSummaryGrid } from "@/components/farmer/dashboard-summary-card";
import { formatDashboardMonthYear } from "@/lib/dashboard-format";
import { getFarmerDashboardStats } from "@/lib/farmer-dashboard-stats";
import {
  CUSTOMERS_PAGE_SIZE,
  CUSTOMER_LIST_SELECT,
  customerListWhere,
} from "@/lib/customer-list-query";
import { prisma } from "@/lib/prisma";
import { CustomersListing } from "./customers-listing";
import { CustomersTableSkeleton } from "./customers-table-skeleton";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function EmptyState({ query }: { query: string }) {
  const hasQuery = query.length > 0;
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {hasQuery ? "No matches found" : "No farmers yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasQuery
          ? "Try a different search term or clear filters."
          : "Add your first farmer record to get started."}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          href="/farmer/new"
          className="inline-flex h-[42px] items-center rounded-full bg-[#2563EB] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1D4ED8]"
        >
          Add Farmer
        </Link>
        {hasQuery ? (
          <Link
            href="/farmer"
            className="inline-flex h-[42px] items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}

async function CustomersContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageRaw } = await searchParams;
  const query = (q ?? "").trim();

  const where = customerListWhere(query);

  const [countAll, totalFiltered] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / CUSTOMERS_PAGE_SIZE));
  const rawPage = Number(pageRaw);
  const pageNum =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const page = Math.min(pageNum, totalPages);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { id: "asc" },
    skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
    take: CUSTOMERS_PAGE_SIZE,
    select: CUSTOMER_LIST_SELECT,
  });

  const start = totalFiltered === 0 ? 0 : (page - 1) * CUSTOMERS_PAGE_SIZE + 1;
  const end = Math.min(page * CUSTOMERS_PAGE_SIZE, totalFiltered);

  if (totalFiltered === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <CustomersListing
      customers={customers}
      totalFiltered={totalFiltered}
      totalAll={countAll}
      query={query}
      page={page}
      totalPages={totalPages}
      start={start}
      end={end}
      pageSize={CUSTOMERS_PAGE_SIZE}
    />
  );
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const stats = await getFarmerDashboardStats();
  const monthYear = formatDashboardMonthYear();

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-6 bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-white to-blue-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Farmers Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor all farmer financials in one place.
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400">{monthYear}</p>
        </div>
      </header>

      <DashboardSummaryGrid stats={stats} />

      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
