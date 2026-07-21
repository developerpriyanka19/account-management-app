import type { Metadata } from "next";
import { getDebitNoteBuilderData, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import { DebitNoteBuilder } from "@/components/debit-note/debit-note-builder";
import { ToastProvider } from "@/components/customer/toast";
import { debitNoteDocumentTitle, debitNoteListPath } from "@/lib/debit-note-routes";
import { DebitNoteType } from "@/lib/debit-note-types";

export const metadata: Metadata = { title: "Create Service Order" };

export default async function CreateServiceOrderPage() {
  const [data, nextNumber] = await Promise.all([
    getDebitNoteBuilderData(),
    getNextDebitNoteNumber(DebitNoteType.SERVICE_ORDER),
  ]);

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DebitNoteBuilder
          type={DebitNoteType.SERVICE_ORDER}
          title={debitNoteDocumentTitle(DebitNoteType.SERVICE_ORDER)}
          nextNumber={nextNumber}
          listHref={debitNoteListPath(DebitNoteType.SERVICE_ORDER)}
          customers={data.customers}
          farmers={data.farmers}
          banks={data.banks}
        />
      </div>
    </ToastProvider>
  );
}
