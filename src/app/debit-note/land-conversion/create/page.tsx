import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";
import { debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Create Land Conversion Debit Note" };

export default async function CreateLandConversionDebitNotePage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber(DebitNoteType.LAND_CONVERSION),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={DebitNoteType.LAND_CONVERSION}
          title="Land Conversion Debit Note"
          nextNumber={nextNumber}
          listHref={debitNoteListPath(DebitNoteType.LAND_CONVERSION)}
          customers={data.customers}
          farmers={data.farmers}
          banks={data.banks}
        />
      </div>
    </ToastProvider>
  );
}
