import type { Metadata } from "next";
import { Suspense } from "react";
import { getDebitNoteList } from "@/actions/debit-note-actions";
import { ToastProvider } from "@/components/customer/toast";
import { DebitNoteListControls } from "@/components/debit-note/debit-note-list-controls";
import { DebitNoteListTable } from "@/components/debit-note/debit-note-list-table";

export const metadata: Metadata = {
  title: "All Debit Notes",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    type?: string;
    status?: string;
    date?: string;
  }>;
};

export default async function AllDebitNotesPage({ searchParams }: Props) {
  const { q, page, type, status, date } = await searchParams;
  const query = (q ?? "").trim();
  const pageNum = Number(page || "1");
  const typeValue = type === "land-conversion" || type === "atl-poa-gpa" ? type : "all";
  const statusValue = status === "DRAFT" || status === "FINAL" ? status : "all";
  const dateValue = (date ?? "").trim();

  const result = await getDebitNoteList({
    query,
    type: typeValue,
    status: statusValue,
    date: dateValue,
    page: Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1,
    pageSize: 10,
  });

  return (
    <ToastProvider>
      <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-semibold text-[#111827]">All Debit Notes</h1>
        </header>
        <Suspense fallback={<p className="text-sm text-[#6B7280]">Loading debit notes…</p>}>
          <DebitNoteListControls
            initialQuery={query}
            initialType={typeValue}
            initialStatus={statusValue}
            initialDate={dateValue}
          />
          <DebitNoteListTable
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
