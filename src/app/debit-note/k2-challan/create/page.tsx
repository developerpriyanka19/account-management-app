import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";
import { debitNoteDocumentTitle, debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Create K2 Challan Debit Note" };

export default async function CreateK2ChallanDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber(DebitNoteType.K2_CHALLAN),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={DebitNoteType.K2_CHALLAN}
          title={debitNoteDocumentTitle(DebitNoteType.K2_CHALLAN)}
          nextNumber={nextNumber}
          listHref={debitNoteListPath(DebitNoteType.K2_CHALLAN)}
          customers={data.customers}
          farmers={data.farmers}
          banks={data.banks}
        />
      </div>
    </ToastProvider>
  );
}
