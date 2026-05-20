import type { ReactNode } from "react";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
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
  return (
    <article className="invoice-print-area mx-auto w-full min-w-0 max-w-[900px] bg-white px-6 py-8 text-[#111827] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <InvoiceHeader data={data} />
      <InvoiceTable data={data} showNaColumns={showNaColumns} />
      <InvoiceSummary data={data} />
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
      <footer className="mt-8 border-t border-[#E5E7EB] pt-4 text-center text-[9px] text-[#6B7280]">
        {footer ?? (
          <>
            <p>{COMPANY_INVOICE_HEADER.footerAddress}</p>
            <p className="mt-1">{COMPANY_INVOICE_HEADER.phone}</p>
          </>
        )}
      </footer>
    </article>
  );
}
