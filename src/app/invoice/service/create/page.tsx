import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getInvoiceBuilderData,
  getServiceInvoiceById,
} from "@/app/invoice/actions";
import { InvoiceBuilder } from "@/components/invoice/invoice-builder";
import { ToastProvider } from "@/components/customer/toast";
import { invoiceRecordToDocument } from "@/lib/invoice-data";

export const metadata: Metadata = {
  title: "Create Service Invoice",
};

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function CreateServiceInvoicePage({ searchParams }: Props) {
  const { edit } = await searchParams;
  const editId = Number(edit ?? "");
  const existingRecord =
    Number.isInteger(editId) && editId > 0 ? await getServiceInvoiceById(editId) : null;
  if (edit && !existingRecord) notFound();
  if (existingRecord && (existingRecord.status ?? "").toUpperCase() === "FINAL") {
    notFound();
  }
  const existing = existingRecord ? invoiceRecordToDocument(existingRecord) : null;
  const { customers, farmers, nextSequence, banks } = await getInvoiceBuilderData();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <InvoiceBuilder
          category="service"
          title={existing ? "Edit Service Invoice" : "Service Invoice"}
          customers={customers}
          farmers={farmers}
          banks={banks}
          nextSequence={nextSequence}
          existing={existing}
        />
      </div>
    </ToastProvider>
  );
}
