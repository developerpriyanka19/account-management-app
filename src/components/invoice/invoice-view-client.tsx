"use client";

import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import { Button } from "@/components/ui/button";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  document: InvoiceDocumentData;
};

export function InvoiceViewClient({ document }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: document.invoiceNumber,
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-md backdrop-blur print:hidden">
        <Button type="button" size="sm" onClick={() => handlePrint()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => handlePrint()}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      <InvoiceDocumentPreview ref={printRef} data={document} />
    </div>
  );
}
