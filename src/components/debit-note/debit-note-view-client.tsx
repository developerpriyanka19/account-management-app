"use client";

import { useEffect, useMemo } from "react";
import { Download, Printer } from "lucide-react";
import {
  generateDebitNotePdf,
  printDebitNotePdf,
} from "@/components/debit-note/debit-note-pdf-generator";
import { DebitNotePdfPreview } from "@/components/debit-note/debit-note-pdf-preview";
import { Button } from "@/components/ui/button";
import type { DebitNotePayload } from "@/lib/debit-note-types";

type Props = {
  document: DebitNotePayload;
  customerName: string;
  gstNumber: string;
  address: string;
  addressLines?: string[];
  autoDownload?: boolean;
  autoPrint?: boolean;
};

export function DebitNoteViewClient({
  document,
  customerName,
  gstNumber,
  address,
  addressLines,
  autoDownload = false,
  autoPrint = false,
}: Props) {
  const ctx = useMemo(
    () => ({ customerName, gstNumber, address, addressLines }),
    [customerName, gstNumber, address, addressLines],
  );

  useEffect(() => {
    if (autoDownload) {
      if (document.id) {
        window.location.replace(`/print/debit-note/${document.id}?download=1`);
        return;
      }
      void generateDebitNotePdf(document, ctx);
    }
  }, [autoDownload, document, ctx]);

  useEffect(() => {
    if (!autoPrint) return;
    if (document.id) {
      window.location.replace(`/print/debit-note/${document.id}`);
      return;
    }
    const timer = window.setTimeout(() => {
      void printDebitNotePdf(document, ctx);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autoPrint, document, ctx]);

  return (
    <div className="space-y-4">
      <div className="top-actions no-print sticky top-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-md backdrop-blur">
        <Button type="button" size="sm" onClick={() => void generateDebitNotePdf(document, ctx)}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void printDebitNotePdf(document, ctx)}
        >
          <Printer className="h-4 w-4" />
          Open PDF to Print
        </Button>
      </div>
      <DebitNotePdfPreview data={document} ctx={ctx} />
    </div>
  );
}
