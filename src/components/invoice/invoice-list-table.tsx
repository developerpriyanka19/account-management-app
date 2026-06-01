"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { deleteInvoice } from "@/app/invoice/actions";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/customer-display";
import type { InvoiceCategoryCode } from "@/lib/invoice-category";
import {
  invoiceListDownloadPath,
  invoiceListEditPath,
  invoiceListViewPath,
} from "@/lib/invoice-category";

type Row = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  subType: string;
  status: string;
  grandTotal: number;
  customer: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  };
};

type Props = {
  category: InvoiceCategoryCode;
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  subtypeColumnLabel: string;
  emptyTitle: string;
};

function customerDisplayName(customer: Row["customer"]) {
  return (
    customer.companyName?.trim() ||
    `${customer.firstName} ${customer.lastName}`.trim() ||
    "—"
  );
}

export function InvoiceListTable({
  category,
  rows,
  page,
  pageSize,
  total,
  query,
  subtypeColumnLabel,
  emptyTitle,
}: Props) {
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

  function handleDelete(id: number, invoiceNumber: string) {
    if (!window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(id, category);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Invoice deleted.");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
        <p className="text-base font-medium text-[#111827]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#6B7280]">Try a different search or create a new invoice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#F3F4F6] text-[#374151]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Invoice No</th>
              <th className="px-3 py-2 text-left font-semibold">Invoice Date</th>
              <th className="px-3 py-2 text-left font-semibold">Customer Name</th>
              <th className="px-3 py-2 text-left font-semibold">{subtypeColumnLabel}</th>
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
                  <td className="px-3 py-2 font-medium">{row.invoiceNumber}</td>
                  <td className="px-3 py-2">{row.invoiceDate}</td>
                  <td className="px-3 py-2">{customerDisplayName(row.customer)}</td>
                  <td className="px-3 py-2">{row.subType || "—"}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatAmount(row.grandTotal)}
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
                        onClick={() => router.push(invoiceListViewPath(category, row.id))}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isFinal}
                        onClick={() => router.push(invoiceListEditPath(category, row.id))}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!isFinal}
                        onClick={() =>
                          window.open(invoiceListDownloadPath(category, row.id), "_blank")
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleDelete(row.id, row.invoiceNumber)}
                      >
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
