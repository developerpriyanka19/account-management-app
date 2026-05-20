import Link from "next/link";
import { notFound } from "next/navigation";
import { getNaInvoiceById } from "@/app/invoice/actions";
import { InvoiceViewClient } from "@/components/invoice/invoice-view-client";
import { ToastProvider } from "@/components/customer/toast";
import { invoiceRecordToDocument } from "@/lib/invoice-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ download?: string }>;
};

export default async function NaInvoiceViewPage({ params, searchParams }: Props) {
  const { id: raw } = await params;
  const { download } = await searchParams;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const record = await getNaInvoiceById(id);
  if (!record) notFound();
  const document = invoiceRecordToDocument(record);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link href="/invoice/na" className="text-sm font-medium text-[#2563EB] hover:underline">
            ← Back to NA Invoices
          </Link>
          <p className="text-sm text-[#6B7280]">{document.invoiceNumber}</p>
        </div>
        {(document.status ?? "").toUpperCase() !== "FINAL" ? (
          <p className="mb-3 rounded-md border border-[#FEF9C3] bg-[#FFFBEB] px-3 py-2 text-sm text-[#854D0E]">
            This invoice is a draft. Generate PDF from edit screen to finalize.
          </p>
        ) : null}
        <InvoiceViewClient
          document={document}
          autoDownload={download === "1" && (document.status ?? "").toUpperCase() === "FINAL"}
        />
      </div>
    </ToastProvider>
  );
}
