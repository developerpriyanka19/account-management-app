import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = { title: "Land Conversion Debit Note" };

export default async function LandConversionDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber("land-conversion"),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type="land-conversion"
          title="Land Conversion Debit Note"
          nextNumber={nextNumber}
          customers={data.customers}
          farmers={data.farmers}
        />
      </div>
    </ToastProvider>
  );
}
