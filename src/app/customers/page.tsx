import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/customer-display";
import {
  CUSTOMERS_PAGE_SIZE,
  CUSTOMER_LIST_SELECT,
  customerListWhere,
} from "@/lib/customer-list-query";
import { CustomersListing } from "./customers-listing";
import { CustomersTableSkeleton } from "./customers-table-skeleton";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function SummaryCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: string;
  description?: string;
  accent?: "green" | "blue";
}) {
  const accentClass =
    accent === "green" ? "text-[#16A34A]" : accent === "blue" ? "text-[#2563EB]" : "text-[#111827]";
  return (
    <div className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{title}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${accentClass}`}>{value}</p>
      {description ? (
        <p className="mt-1 text-[11px] text-[#6B7280]">{description}</p>
      ) : null}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const hasQuery = query.length > 0;
  return (
    <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-[#111827]">
        {hasQuery ? "No matches found" : "No customers yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
        {hasQuery
          ? "Try a different search term or clear filters."
          : "Add your first customer record."}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          href="/customers/new"
          className="inline-flex h-8 items-center rounded-md bg-[#2563EB] px-4 text-xs font-medium text-white hover:bg-[#1D4ED8]"
        >
          Add customer
        </Link>
        {hasQuery ? (
          <Link
            href="/customers"
            className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] px-4 text-xs font-medium text-[#111827] hover:bg-[#F5F7FA]"
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

  const [countAll, sumAgg, totalFiltered] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.aggregate({
      _sum: { balanceReceivable: true, rentAmount: true },
    }),
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
  const [countAll, sumAgg] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.aggregate({
      _sum: { balanceReceivable: true, rentAmount: true },
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-4 bg-white px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <header className="border-b border-[#D1D5DB] pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">
          Customers
        </h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Total customers"
          value={countAll.toLocaleString("en-IN")}
          accent="blue"
        />
        <SummaryCard
          title="Total rent"
          value={formatAmount(sumAgg._sum.rentAmount ?? 0)}
          accent="green"
        />
        <SummaryCard
          title="Balance receivable"
          value={formatAmount(sumAgg._sum.balanceReceivable ?? 0)}
          accent="green"
        />
      </section>

      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
