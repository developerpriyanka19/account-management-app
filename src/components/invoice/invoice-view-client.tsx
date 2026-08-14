"use client";

import { useEffect } from "react";
import { Download, Printer } from "lucide-react";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import {
  generateInvoicePdf,
  printInvoicePdf,
} from "@/components/invoice/invoice-pdf-generator";
import { Button } from "@/components/ui/button";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  document: InvoiceDocumentData;
  autoDownload?: boolean;
  autoPrint?: boolean;
};

export function InvoiceViewClient({ document, autoDownload = false, autoPrint = false }: Props) {
  useEffect(() => {
    if (autoDownload) {
      if (document.id) {
        window.location.replace(`/print/invoice/${document.id}?download=1`);
        return;
      }
      void generateInvoicePdf(document);
    }
  }, [autoDownload, document]);

  useEffect(() => {
    if (!autoPrint) return;
    if (document.id) {
      window.location.replace(`/print/invoice/${document.id}`);
      return;
    }
    const timer = window.setTimeout(() => {
      void printInvoicePdf(document);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autoPrint, document]);

  return (
    <div className="space-y-4">
      <div className="top-actions no-print sticky top-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-md backdrop-blur">
        <Button type="button" size="sm" onClick={() => void generateInvoicePdf(document)}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void printInvoicePdf(document)}
        >
          <Printer className="h-4 w-4" />
          Open PDF to Print
        </Button>
      </div>
      <InvoiceDocumentPreview data={document} />
    </div>
  );
}
