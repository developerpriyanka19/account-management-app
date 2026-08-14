"use client";

import { InvoicePdfPreview } from "./invoice-pdf-preview";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

/** Modal preview — renders the same jsPDF output as download/print. */
export function InvoiceDocumentPreview({ data }: Props) {
  return (
    <div className="invoice-preview-root no-print mx-auto w-full min-w-0 overflow-x-hidden print:hidden">
      <InvoicePdfPreview data={data} />
    </div>
  );
}
