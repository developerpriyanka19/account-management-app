import type { Metadata } from "next";
import { Suspense } from "react";
import { getInvoiceList, type InvoiceListSortField } from "@/app/invoice/actions";
import { InvoiceListControls } from "@/components/invoice/invoice-list-controls";
import { InvoiceListTable } from "@/components/invoice/invoice-list-table";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = {
  title: "NA Invoices",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    sortDir?: string;
  }>;
};

export default async function NaInvoicePage({ searchParams }: Props) {
  const { q, page, sort: sortRaw, sortDir: sortDirRaw } = await searchParams;
  const query = (q ?? "").trim();
  const pageNum = Number(page || "1");
  const sort: InvoiceListSortField = sortRaw === "amount" ? "amount" : "date";
  const sortDir = sortDirRaw === "asc" ? "asc" : "desc";
  const result = await getInvoiceList({
    category: "NA",
    query,
    page: Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1,
    pageSize: 10,
    sort,
    sortDir,
  });

  return (
    <ToastProvider>
      <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[#111827]">NA Invoices</h1>
        </header>
        <Suspense fallback={<p className="text-sm text-[#6B7280]">Loading invoices…</p>}>
          <InvoiceListControls
            initialQuery={query}
            createHref="/invoice/na/create"
            createLabel="+ Create NA Invoice"
            sort={sort}
            sortDir={sortDir}
          />
          <InvoiceListTable
            category="NA"
            rows={result.rows}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            query={query}
            subtypeColumnLabel="NA Sub Type"
            emptyTitle="No NA invoices found"
          />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
