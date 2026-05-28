"use client";

import { useEffect, useRef } from "react";
import { Download, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { DebitNoteTemplate } from "@/components/debit-note/debit-note-template";
import { Button } from "@/components/ui/button";
import type { DebitNotePayload } from "@/lib/debit-note-types";

type Props = {
  document: DebitNotePayload;
  customerName: string;
  gstNumber: string;
  address: string;
  autoDownload?: boolean;
  autoPrint?: boolean;
};

export function DebitNoteViewClient({
  document,
  customerName,
  gstNumber,
  address,
  autoDownload = false,
  autoPrint = false,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: document.debitNoteNo,
  });

  async function handleDownload() {
    if (!printRef.current) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    await doc.html(printRef.current, {
      margin: [4, 4, 4, 4],
      autoPaging: "text",
      width: 202,
      windowWidth: 900,
      html2canvas: { scale: 0.6 },
      callback: (pdf) => {
        pdf.save(`${document.debitNoteNo || "debit-note"}.pdf`);
      },
    });
  }

  useEffect(() => {
    if (autoDownload) {
      void handleDownload();
    }
  }, [autoDownload]);

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
        <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload()}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      <div ref={printRef}>
        <DebitNoteTemplate
          data={document}
          customerName={customerName}
          gstNumber={gstNumber}
          address={address}
        />
      </div>
    </div>
  );
}
