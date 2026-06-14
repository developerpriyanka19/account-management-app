import { notFound, redirect } from "next/navigation";
import { getDebitNoteBuilderData, getDebitNoteById } from "@/actions/debit-note-actions";
import { ToastProvider } from "@/components/customer/toast";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { debitNoteRecordToPayload } from "@/lib/debit-note-data";
import { debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDebitNotePage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const record = await getDebitNoteById(id);
  if (!record) notFound();
  if ((record.status ?? "").toUpperCase() === "FINAL") {
    redirect(`/debit-note/${id}`);
  }

  const existing = debitNoteRecordToPayload(record);
  const { customers, farmers, banks } = await getDebitNoteBuilderData();
  const isLand = existing.type === DebitNoteType.LAND_CONVERSION;

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={existing.type}
          title={isLand ? "Land Conversion Debit Note" : "ATL and POA/GPA Debit Note"}
          nextNumber={existing.debitNoteNo}
          listHref={debitNoteListPath(existing.type)}
          customers={customers}
          farmers={farmers}
          banks={banks}
          existing={existing}
        />
      </div>
    </ToastProvider>
  );
}
