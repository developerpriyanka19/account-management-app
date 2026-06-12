"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { deleteDebitNote } from "@/actions/debit-note-actions";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/lib/customer-display";
import {
  debitNoteCreatePath,
  debitNoteEditPath,
  debitNotePdfPath,
  debitNoteViewPath,
} from "@/lib/debit-note-routes";
import type { DebitNoteType } from "@/lib/debit-note-types";

type Row = {
  id: number;
  debitNoteNo: string;
  date: string;
  district: string | null;
  taluk: string | null;
  village: string | null;
  total: number;
  status: string;
  customer: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  };
};

type Props = {
  type: DebitNoteType;
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  emptyTitle: string;
};

function customerDisplayName(customer: Row["customer"]) {
  return (
    customer.companyName?.trim() ||
    `${customer.firstName} ${customer.lastName}`.trim() ||
    "—"
  );
}

export function DebitNoteListTable({
  type,
  rows,
  page,
  pageSize,
  total,
  query,
  emptyTitle,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(page);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  useEffect(() => setCurrentPage(page), [page]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const createHref = debitNoteCreatePath(type);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    if (query) params.set("q", query);
    else params.delete("q");
    setCurrentPage(nextPage);
    router.push(`${pathname}?${params.toString()}`);
  }

  function confirmDelete() {
    if (deleteId == null) return;
    startTransition(async () => {
      const result = await deleteDebitNote(deleteId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Debit Note deleted successfully.");
      setDeleteId(null);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
        <p className="text-base font-medium text-[#111827]">{emptyTitle}</p>
        <Button
          type="button"
          className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          onClick={() => router.push(createHref)}
        >
          Create New Debit Note
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-[#F3F4F6] text-[#374151]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Debit Note No</th>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-left font-semibold">Customer</th>
                <th className="px-3 py-2 text-left font-semibold">Village</th>
                <th className="px-3 py-2 text-left font-semibold">Taluk</th>
                <th className="px-3 py-2 text-left font-semibold">District</th>
                <th className="px-3 py-2 text-right font-semibold">Total Amount</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isFinal = (row.status ?? "").toUpperCase() === "FINAL";
                return (
                  <tr key={row.id} className={index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                    <td className="px-3 py-2 font-medium">{row.debitNoteNo}</td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{customerDisplayName(row.customer)}</td>
                    <td className="px-3 py-2">{row.village?.trim() || "—"}</td>
                    <td className="px-3 py-2">{row.taluk?.trim() || "—"}</td>
                    <td className="px-3 py-2">{row.district?.trim() || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {formatAmount(row.total)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          isFinal
                            ? "inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]"
                            : "inline-flex rounded-full bg-[#FEF9C3] px-2 py-0.5 text-xs font-medium text-[#854D0E]"
                        }
                      >
                        {isFinal ? "Final" : "Draft"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(debitNoteViewPath(row.id))}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isFinal}
                          onClick={() => router.push(debitNoteEditPath(row.id))}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(debitNotePdfPath(row.id), "_blank")}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Generate PDF
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

      <Dialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Debit Note?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
