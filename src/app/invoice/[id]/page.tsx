import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/app/invoice/actions";
import { InvoiceViewClient } from "@/components/invoice/invoice-view-client";
import { invoiceRecordToDocument } from "@/lib/invoice-data";
import { ToastProvider } from "@/components/customer/toast";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceViewPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const record = await getInvoiceById(id);
  if (!record) notFound();

  const document = invoiceRecordToDocument(record);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={document.invoiceType === "na" ? "/invoice/na" : "/invoice/service"}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            ← Create another invoice
          </Link>
          <p className="text-sm text-[#6B7280]">
            {document.invoiceNumber} · <span className="capitalize">{document.status}</span>
          </p>
        </div>
        <InvoiceViewClient document={document} />
      </div>
    </ToastProvider>
  );
}
