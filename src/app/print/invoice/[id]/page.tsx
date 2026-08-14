import { notFound } from "next/navigation";
import { getInvoiceById } from "@/app/invoice/actions";
import { InvoicePdfExportClient } from "@/components/pdf/invoice-pdf-export";
import { invoiceRecordToDocument } from "@/lib/invoice-data";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string; download?: string }>;
};

export default async function PrintInvoicePage({ params, searchParams }: PageProps) {
  const { id: idRaw } = await params;
  const { action, download } = await searchParams;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const record = await getInvoiceById(id);
  if (!record) notFound();

  const document = invoiceRecordToDocument(record);
  const exportAction = download === "1" || action === "download" ? "download" : "open";

  return <InvoicePdfExportClient document={document} action={exportAction} />;
}
