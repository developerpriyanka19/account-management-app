import Link from "next/link";
import { notFound } from "next/navigation";
import { getDebitNoteById } from "@/actions/debit-note-actions";
import { ToastProvider } from "@/components/customer/toast";
import { DebitNoteViewClient } from "@/components/debit-note/debit-note-view-client";
import { debitNoteRecordToPayload } from "@/lib/debit-note-data";
import { debitNoteListPath } from "@/lib/debit-note-routes";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ download?: string; print?: string }>;
};

export default async function DebitNoteViewPage({ params, searchParams }: Props) {
  const { id: raw } = await params;
  const { download, print } = await searchParams;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const record = await getDebitNoteById(id);
  if (!record) notFound();

  const document = debitNoteRecordToPayload(record);
  const listHref = debitNoteListPath(document.type);
  const customerName =
    record.customer.companyName?.trim() ||
    `${record.customer.firstName} ${record.customer.lastName}`.trim() ||
    "—";
  const address = [
    record.customer.companyAddress,
    record.customer.buildingNumber,
    record.customer.street,
    record.customer.locality,
    record.customer.village,
    record.customer.district,
    record.customer.state,
    record.customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link href={listHref} className="text-sm font-medium text-[#2563EB] hover:underline">
            ← Back to Debit Notes
          </Link>
          <p className="text-sm text-[#6B7280]">{document.debitNoteNo}</p>
        </div>
        <DebitNoteViewClient
          document={document}
          customerName={customerName}
          gstNumber={record.customer.gstNumber || ""}
          address={address}
          autoDownload={download === "1"}
          autoPrint={print === "1"}
        />
      </div>
    </ToastProvider>
  );
}
