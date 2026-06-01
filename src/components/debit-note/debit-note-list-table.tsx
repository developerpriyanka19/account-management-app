"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { deleteDebitNote } from "@/actions/debit-note-actions";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  debitNoteNo: string;
  type: string;
  date: string;
  remarks: string | null;
  total: number;
  status: string;
  customer: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  };
};

type Props = {
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
};

function formatType(type: string) {
  return type === "land-conversion" ? "Land Conversion" : "ATL and POA/GPA";
}

export function DebitNoteListTable({ rows, page, pageSize, total, query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(page);
  useEffect(() => setCurrentPage(page), [page]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    if (query) params.set("q", query);
    else params.delete("q");
    setCurrentPage(nextPage);
    router.push(`${pathname}?${params.toString()}`);
  }

  function onDelete(id: number) {
    const ok = window.confirm("Delete this debit note?");
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteDebitNote(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Debit note deleted.");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
        <p className="text-base font-medium text-[#111827]">No debit notes found</p>
        <p className="mt-1 text-sm text-[#6B7280]">Try a different search/filter or create a new debit note.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-[#F3F4F6] text-[#374151]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Debit Note No</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Customer Name</th>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Remark</th>
              <th className="px-3 py-2 text-left font-semibold">Total Amount</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isFinal = (row.status ?? "").toUpperCase() === "FINAL";
              const customerName =
                row.customer.companyName || `${row.customer.firstName} ${row.customer.lastName}`.trim();
              return (
                <tr key={row.id} className={index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                  <td className="px-3 py-2 font-medium">{row.debitNoteNo}</td>
                  <td className="px-3 py-2">{formatType(row.type)}</td>
                  <td className="px-3 py-2">{customerName}</td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="max-w-[200px] truncate px-3 py-2" title={row.remarks ?? ""}>
                    {row.remarks?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2">{row.total.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        isFinal
                          ? "inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]"
                          : "inline-flex rounded-full bg-[#FEF9C3] px-2 py-0.5 text-xs font-medium text-[#854D0E]"
                      }
                    >
                      {isFinal ? "Generated" : "Draft"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/debit-note/view/${row.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/debit-note/${row.id}?download=1`, "_blank")}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/debit-note/${row.id}?print=1`, "_blank")}>
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isFinal}
                        onClick={() => router.push(`/debit-note/${row.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => onDelete(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-[#6B7280]">
          Page {currentPage} of {totalPages} · {total} total
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
