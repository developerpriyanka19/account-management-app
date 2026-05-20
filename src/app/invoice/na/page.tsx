import type { Metadata } from "next";
import { Suspense } from "react";
import { getNaInvoiceList } from "@/app/invoice/actions";
import { NaInvoiceListControls } from "@/components/invoice/na-invoice-list-controls";
import { NaInvoiceListTable } from "@/components/invoice/na-invoice-list-table";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = {
  title: "NA Invoices",
};

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function NaInvoicePage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = (q ?? "").trim();
  const pageNum = Number(page || "1");
  const result = await getNaInvoiceList({
    query,
    page: Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1,
    pageSize: 10,
  });

  return (
    <ToastProvider>
      <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-semibold text-[#111827]">NA Invoices</h1>
        </header>
        <Suspense fallback={<p className="text-sm text-[#6B7280]">Loading invoices…</p>}>
          <NaInvoiceListControls initialQuery={query} />
          <NaInvoiceListTable
            rows={result.rows}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            query={query}
          />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
