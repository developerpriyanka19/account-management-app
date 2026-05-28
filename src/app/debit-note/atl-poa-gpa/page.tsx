import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = { title: "ATL and POA/GPA Debit Note" };

export default async function AtlPoaGpaDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber("atl-poa-gpa"),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type="atl-poa-gpa"
          title="ATL and POA/GPA Debit Note"
          nextNumber={nextNumber}
          customers={data.customers}
          farmers={data.farmers}
        />
      </div>
    </ToastProvider>
  );
}
