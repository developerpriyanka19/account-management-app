"use client";

import { useEffect, useState } from "react";
import {
  generateDebitNotePdf,
  getDebitNotePdfBlob,
} from "@/components/debit-note/debit-note-pdf-generator";
import { downloadPdfBlob, openPdfBlobInNewTab } from "@/lib/pdf-print";
import type { DebitNotePayload } from "@/lib/debit-note-types";

type DebitNoteContext = {
  customerName: string;
  gstNumber: string;
  address: string;
};

type Props = {
  document: DebitNotePayload;
  ctx: DebitNoteContext;
  action: "open" | "download";
};

export function DebitNotePdfExportClient({ document, ctx, action }: Props) {
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const filename = `${document.debitNoteNo || "debit-note"}.pdf`;

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function run() {
      if (action === "download") {
        await generateDebitNotePdf(document, ctx);
        return;
      }
      const blob = await getDebitNotePdfBlob(document, ctx);
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
  }, [document, ctx, action, filename]);

  if (action === "download") {
    return (
      <p className="p-6 text-center text-sm text-[#374151]">Downloading {filename}…</p>
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
          Open {filename}
        </a>
        <button
          type="button"
          className="text-sm text-[#6B7280] hover:underline"
          onClick={() => {
            void getDebitNotePdfBlob(document, ctx).then((blob) => {
              downloadPdfBlob(blob, filename);
            });
          }}
        >
          Download instead
        </button>
      </div>
    );
  }

  return <p className="p-6 text-center text-sm text-[#374151]">Opening {filename}…</p>;
}
