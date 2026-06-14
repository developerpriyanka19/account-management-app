import type { Metadata } from "next";
import { Suspense } from "react";
import { getBankDetailsList } from "@/actions/bank-details-actions";
import { BankDetailsListing } from "@/components/bank/bank-details-listing";
import { ToastProvider } from "@/components/customer/toast";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Bank Details" };

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

async function BankDetailsContent({ searchParams }: Props) {
  const { q, page: pageRaw } = await searchParams;
  const query = (q ?? "").trim();
  const pageNum = Number(pageRaw || "1");
  const result = await getBankDetailsList({
    query,
    page: Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1,
  });

  return (
    <BankDetailsListing
      rows={result.rows}
      total={result.total}
      query={query}
      page={result.page}
      pageSize={result.pageSize}
    />
  );
}

function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default async function BankDetailsPage({ searchParams }: Props) {
  return (
    <ToastProvider>
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-[#D1D5DB] pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">
            Bank Details
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage bank accounts for invoices and debit notes
          </p>
        </header>
        <Suspense fallback={<ListingSkeleton />}>
          <BankDetailsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
