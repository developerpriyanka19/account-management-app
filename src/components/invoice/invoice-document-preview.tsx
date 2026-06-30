"use client";

import { NaInvoiceTemplate } from "./na-invoice-template";
import { ServiceInvoiceTemplate } from "./service-invoice-template";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

export function InvoiceDocumentPreview({ data }: Props) {
  return (
    <div className="invoice-preview-root no-print mx-auto w-full min-w-0 overflow-x-hidden print:hidden">
      <div className="invoice-a4-viewport flex justify-center overflow-x-hidden bg-[#E5E7EB] p-4">
        <div className="invoice-a4-scale w-full max-w-[210mm]">
          {data.invoiceType === "na" ? (
            <NaInvoiceTemplate data={data} />
          ) : (
            <ServiceInvoiceTemplate data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
