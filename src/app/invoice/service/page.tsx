import type { Metadata } from "next";
import { Suspense } from "react";
import { getInvoiceList, type InvoiceListSortField } from "@/app/invoice/actions";
import { InvoiceListControls } from "@/components/invoice/invoice-list-controls";
import { InvoiceListTable } from "@/components/invoice/invoice-list-table";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = {
  title: "Service Invoices",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    sortDir?: string;
  }>;
};

export default async function ServiceInvoiceListPage({ searchParams }: Props) {
  const { q, page, sort: sortRaw, sortDir: sortDirRaw } = await searchParams;
  const query = (q ?? "").trim();
  const pageNum = Number(page || "1");
  const sort: InvoiceListSortField = sortRaw === "amount" ? "amount" : "date";
  const sortDir = sortDirRaw === "asc" ? "asc" : "desc";
  const result = await getInvoiceList({
    category: "SERVICE",
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
          <h1 className="text-2xl font-semibold text-[#111827]">Service Invoices</h1>
        </header>
        <Suspense fallback={<p className="text-sm text-[#6B7280]">Loading invoices…</p>}>
          <InvoiceListControls
            initialQuery={query}
            createHref="/invoice/service/create"
            createLabel="+ Create Service Invoice"
            sort={sort}
            sortDir={sortDir}
          />
          <InvoiceListTable
            category="SERVICE"
            rows={result.rows}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            query={query}
            subtypeColumnLabel="Invoice Type / Service Sub-Type"
            emptyTitle="No service invoices found"
          />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
