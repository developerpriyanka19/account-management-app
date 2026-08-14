import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";
import { debitNoteDocumentTitle, debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Create Lease Deed Execution Debit Note" };

export default async function CreateLeaseDeedExecutionDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber(DebitNoteType.LEASE_DEED_EXECUTION),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={DebitNoteType.LEASE_DEED_EXECUTION}
          title={debitNoteDocumentTitle(DebitNoteType.LEASE_DEED_EXECUTION)}
          nextNumber={nextNumber}
          listHref={debitNoteListPath(DebitNoteType.LEASE_DEED_EXECUTION)}
          customers={data.customers}
          farmers={data.farmers}
          banks={data.banks}
        />
      </div>
    </ToastProvider>
  );
}
