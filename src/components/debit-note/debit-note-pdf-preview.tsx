"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getDebitNotePdfBlob } from "@/components/debit-note/debit-note-pdf-generator";
import type { DebitNotePayload } from "@/lib/debit-note-types";

type Ctx = {
  customerName: string;
  gstNumber: string;
  address: string;
  addressLines?: string[];
};

/** Renders the generated jsPDF output — preview matches download/print exactly. */
export function DebitNotePdfPreview({
  data,
  ctx,
}: {
  data: DebitNotePayload;
  ctx: Ctx;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setUrl(null);
    setError(false);

    void getDebitNotePdfBlob(data, ctx)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data, ctx]);

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-600">Failed to generate PDF preview.</p>
    );
  }

  if (!url) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6B7280]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm">Generating PDF preview…</span>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="Debit Note PDF preview"
      className="h-[min(82vh,297mm)] w-full rounded border border-[#D1D5DB] bg-white"
    />
  );
}
