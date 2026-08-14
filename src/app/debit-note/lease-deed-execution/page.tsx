import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDebitNoteCustomerOptions,
  getDebitNoteList,
  type DebitNoteListSortField,
} from "@/actions/debit-note-actions";
import { DebitNoteListControls } from "@/components/debit-note/debit-note-list-controls";
import { DebitNoteListTable } from "@/components/debit-note/debit-note-list-table";
import { ToastProvider } from "@/components/customer/toast";
import {
  debitNoteCreateLabel,
  debitNoteCreatePath,
  debitNoteEmptyTitle,
  debitNoteListTitle,
} from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Lease Deed Execution Debit Notes" };

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    sortDir?: string;
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function LeaseDeedExecutionDebitNotesPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const pageNum = Number(params.page || "1");
  const sort: DebitNoteListSortField =
    params.sort === "amount" ? "amount" : params.sort === "customer" ? "customer" : "date";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  const statusValue =
    params.status === "DRAFT" || params.status === "FINAL" ? params.status : "all";
  const customerIdNum = Number(params.customerId ?? "");
  const customerId =
    Number.isInteger(customerIdNum) && customerIdNum > 0 ? customerIdNum : undefined;
  const dateFrom = (params.dateFrom ?? "").trim();
  const dateTo = (params.dateTo ?? "").trim();

  const [result, customers] = await Promise.all([
    getDebitNoteList({
      type: DebitNoteType.LEASE_DEED_EXECUTION,
      query,
      status: statusValue,
      customerId,
      dateFrom,
      dateTo,
      page: Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1,
      pageSize: 10,
      sort,
      sortDir,
    }),
    getDebitNoteCustomerOptions(),
  ]);

  return (
    <ToastProvider>
      <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[#111827]">
            {debitNoteListTitle(DebitNoteType.LEASE_DEED_EXECUTION)}
          </h1>
        </header>
        <Suspense fallback={<p className="text-sm text-[#6B7280]">Loading debit notes…</p>}>
          <DebitNoteListControls
            initialQuery={query}
            initialStatus={statusValue}
            initialCustomerId={customerId ? String(customerId) : ""}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            createHref={debitNoteCreatePath(DebitNoteType.LEASE_DEED_EXECUTION)}
            createLabel={debitNoteCreateLabel(DebitNoteType.LEASE_DEED_EXECUTION)}
            sort={sort}
            sortDir={sortDir}
            customers={customers}
          />
          <DebitNoteListTable
            type={DebitNoteType.LEASE_DEED_EXECUTION}
            rows={result.rows}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            query={query}
            emptyTitle={debitNoteEmptyTitle(DebitNoteType.LEASE_DEED_EXECUTION)}
          />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
