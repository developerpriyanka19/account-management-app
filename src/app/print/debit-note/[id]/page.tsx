import { notFound } from "next/navigation";
import { getDebitNoteById } from "@/actions/debit-note-actions";
import { DebitNotePdfExportClient } from "@/components/pdf/debit-note-pdf-export";
import { debitNoteRecordToPayload } from "@/lib/debit-note-data";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string; download?: string }>;
};

export default async function PrintDebitNotePage({ params, searchParams }: PageProps) {
  const { id: idRaw } = await params;
  const { action, download } = await searchParams;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const record = await getDebitNoteById(id);
  if (!record) notFound();

  const document = debitNoteRecordToPayload(record);
  const customerName =
    record.customer.companyName?.trim() ||
    `${record.customer.firstName} ${record.customer.lastName}`.trim() ||
    "—";
  const addressLines = [
    record.customer.buildingNumber,
    record.customer.street,
    record.customer.locality,
    record.customer.village,
    record.customer.district,
    record.customer.state,
    record.customer.pincode ? `PIN ${record.customer.pincode}` : null,
  ].filter((v): v is string => Boolean(v?.trim()));

  const address = [
    record.customer.companyAddress,
    ...addressLines,
  ]
    .filter(Boolean)
    .join(", ");

  const ctx = {
    customerName,
    gstNumber: record.customer.gstNumber || "",
    address,
    addressLines,
  };

  const exportAction = download === "1" || action === "download" ? "download" : "open";

  return <DebitNotePdfExportClient document={document} ctx={ctx} action={exportAction} />;
}
