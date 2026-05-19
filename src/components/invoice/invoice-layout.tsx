import type { ReactNode } from "react";
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
      {data.notes ? (
        <p className="mt-4 text-[10px] text-[#6B7280]">
          <span className="font-semibold">Notes: </span>
          {data.notes}
        </p>
      ) : null}
      <footer className="mt-8 border-t border-[#E5E7EB] pt-4 text-center text-[9px] text-[#6B7280]">
        {footer ?? (
          <>
            <p>This is a computer-generated invoice.</p>
            <p className="mt-1">Subject to Bengaluru jurisdiction.</p>
          </>
        )}
      </footer>
    </article>
  );
}
