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
        className="invoice-preview-root mx-auto w-full min-w-0 max-w-[900px]"
      >
        <div className="overflow-x-auto overscroll-x-contain scroll-smooth rounded-sm">
          <div className="mx-auto min-w-[850px] max-w-[900px]">
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
