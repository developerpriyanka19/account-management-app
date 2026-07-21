"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Download, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toDisplayDate } from "@/lib/date-format";

type Row = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  district: string | null;
  taluk: string | null;
  village: string | null;
  status: string;
  pdfUrl: string | null;
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

export function NaInvoiceListTable({ rows, page, pageSize, total, query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(page);
  useEffect(() => setCurrentPage(page), [page]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseParams = new URLSearchParams();
  if (query) baseParams.set("q", query);
  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    if (query) params.set("q", query);
    else params.delete("q");
    setCurrentPage(nextPage);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
        <p className="text-base font-medium text-[#111827]">No NA invoices found</p>
        <p className="mt-1 text-sm text-[#6B7280]">Try a different search or create a new invoice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-[#F3F4F6] text-[#374151]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Invoice Number</th>
              <th className="px-3 py-2 text-left font-semibold">Customer Name</th>
              <th className="px-3 py-2 text-left font-semibold">Invoice Date</th>
              <th className="px-3 py-2 text-left font-semibold">District</th>
              <th className="px-3 py-2 text-left font-semibold">Taluk</th>
              <th className="px-3 py-2 text-left font-semibold">Village</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isFinal = (row.status ?? "").toUpperCase() === "FINAL";
              const canDownload = isFinal;
              return (
              <tr key={row.id} className={index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                <td className="px-3 py-2 font-medium">{row.invoiceNumber}</td>
                <td className="px-3 py-2">
                  {row.customer.companyName || `${row.customer.firstName} ${row.customer.lastName}`.trim()}
                </td>
                <td className="px-3 py-2">{toDisplayDate(row.invoiceDate) || row.invoiceDate}</td>
                <td className="px-3 py-2">{row.district || "—"}</td>
                <td className="px-3 py-2">{row.taluk || "—"}</td>
                <td className="px-3 py-2">{row.village || "—"}</td>
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
                      onClick={() => router.push(`/invoice/na/view/${row.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canDownload}
                      onClick={() => window.open(`/invoice/na/${row.id}?download=1`, "_blank")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canDownload}
                      onClick={() => window.open(`/invoice/na/${row.id}?print=1`, "_blank")}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isFinal}
                      onClick={() => router.push(`/invoice/na/${row.id}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {!canDownload ? (
                      <span className="self-center text-xs text-[#6B7280]">PDF not generated</span>
                    ) : null}
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
