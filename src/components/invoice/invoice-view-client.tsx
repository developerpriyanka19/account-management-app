"use client";

import { useEffect, useRef } from "react";
import { Download, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import { generateInvoicePdf } from "@/components/invoice/invoice-pdf-generator";
import { Button } from "@/components/ui/button";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  document: InvoiceDocumentData;
  autoDownload?: boolean;
  autoPrint?: boolean;
};

export function InvoiceViewClient({ document, autoDownload = false, autoPrint = false }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: document.invoiceNumber,
  });
  useEffect(() => {
    if (autoDownload) {
      void generateInvoicePdf(document);
    }
  }, [autoDownload, document]);
  useEffect(() => {
    if (autoPrint) {
      setTimeout(() => {
        void handlePrint();
      }, 250);
    }
  }, [autoPrint, handlePrint]);

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-md backdrop-blur print:hidden">
        <Button type="button" size="sm" onClick={() => handlePrint()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void generateInvoicePdf(document)}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      <InvoiceDocumentPreview ref={printRef} data={document} />
    </div>
  );
}
