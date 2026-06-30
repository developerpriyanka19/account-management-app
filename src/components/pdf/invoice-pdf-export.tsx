"use client";

import { useEffect, useState } from "react";
import {
  generateInvoicePdf,
  getInvoicePdfBlob,
} from "@/components/invoice/invoice-pdf-generator";
import { downloadPdfBlob, openPdfBlobInNewTab } from "@/lib/pdf-print";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  document: InvoiceDocumentData;
  action: "open" | "download";
};

export function InvoicePdfExportClient({ document, action }: Props) {
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function run() {
      const filename = `${document.invoiceNumber}.pdf`;
      if (action === "download") {
        await generateInvoicePdf(document);
        return;
      }
      const blob = await getInvoicePdfBlob(document);
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      const opened = openPdfBlobInNewTab(blob, filename);
      if (!opened) {
        setPopupBlocked(true);
      }
    }

    void run();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document, action]);

  if (action === "download") {
    return (
      <p className="p-6 text-center text-sm text-[#374151]">
        Downloading {document.invoiceNumber}.pdf…
      </p>
    );
  }

  if (popupBlocked && blobUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-[#374151]">
          Your browser blocked the PDF tab. Use the link below to open the document, then print from
          the PDF viewer.
        </p>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          Open {document.invoiceNumber}.pdf
        </a>
        <button
          type="button"
          className="text-sm text-[#6B7280] hover:underline"
          onClick={() => {
            void getInvoicePdfBlob(document).then((blob) => {
              downloadPdfBlob(blob, `${document.invoiceNumber}.pdf`);
            });
          }}
        >
          Download instead
        </button>
      </div>
    );
  }

  return (
    <p className="p-6 text-center text-sm text-[#374151]">
      Opening {document.invoiceNumber}.pdf…
    </p>
  );
}
