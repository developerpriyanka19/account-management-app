import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";
import { debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Create ATL and POA/GPA Debit Note" };

export default async function CreateAtlPoaGpaDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber(DebitNoteType.ATL_POA),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={DebitNoteType.ATL_POA}
          title="ATL and POA/GPA Debit Note"
          nextNumber={nextNumber}
          listHref={debitNoteListPath(DebitNoteType.ATL_POA)}
          customers={data.customers}
          farmers={data.farmers}
        />
      </div>
    </ToastProvider>
  );
}
