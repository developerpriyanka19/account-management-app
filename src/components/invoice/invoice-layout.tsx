import type { ReactNode } from "react";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceSummary } from "./invoice-summary";
import { InvoiceTable } from "./invoice-table";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
  showNaColumns?: boolean;
  footer?: ReactNode;
};

/** A4 print-friendly invoice document shell. */
export function InvoiceLayout({ data, showNaColumns = true, footer }: Props) {
  const isService = !showNaColumns;
  return (
    <article
      className={
        isService
          ? "invoice-print-area mx-auto flex min-h-[277mm] w-full min-w-0 max-w-[900px] flex-col bg-white px-4 py-4 text-[#111827] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none"
          : "invoice-print-area mx-auto flex min-h-[277mm] w-full min-w-0 max-w-[900px] flex-col bg-white px-6 py-8 text-[#111827] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none"
      }
    >
      <InvoiceHeader data={data} compact={isService} />
      <InvoiceTable data={data} showNaColumns={showNaColumns} />
      <InvoiceSummary data={data} compact={isService} />
      {data.totalAmountWords ? (
        <p className="mt-3 text-[11px] text-[#111827]">
          <span className="font-semibold">Total Amount in Words: </span>
          {data.totalAmountWords}
        </p>
      ) : null}
      {data.notes ? (
        <p className="mt-4 text-[10px] text-[#6B7280]">
          <span className="font-semibold">Notes: </span>
          {data.notes}
        </p>
      ) : null}
      {footer ?? <CompanyDocumentFooter className="mt-auto pt-4" compact={isService} />}
    </article>
  );
}
