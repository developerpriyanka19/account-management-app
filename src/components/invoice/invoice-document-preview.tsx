"use client";

import { forwardRef } from "react";
import { NaInvoiceTemplate } from "./na-invoice-template";
import { ServiceInvoiceTemplate } from "./service-invoice-template";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

export const InvoiceDocumentPreview = forwardRef<HTMLDivElement, Props>(
  function InvoiceDocumentPreview({ data }, ref) {
    return (
      <div
        ref={ref}
        className="invoice-preview-root mx-auto w-full min-w-0 overflow-x-hidden"
      >
        <div className="invoice-a4-viewport flex justify-center overflow-x-hidden bg-[#E5E7EB] p-4 print:bg-white print:p-0">
          <div className="invoice-a4-scale w-full max-w-[210mm] print:max-w-none print:transform-none">
            {data.invoiceType === "na" ? (
              <NaInvoiceTemplate data={data} />
            ) : (
              <ServiceInvoiceTemplate data={data} />
            )}
          </div>
        </div>
      </div>
    );
  },
);
