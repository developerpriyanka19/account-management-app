import type { Metadata } from "next";
import { getInvoiceBuilderData, getNaInvoiceById } from "@/app/invoice/actions";
import { NaInvoiceForm } from "@/components/invoice/na-invoice-form";
import { ToastProvider } from "@/components/customer/toast";
import { invoiceRecordToDocument } from "@/lib/invoice-data";

export const metadata: Metadata = {
  title: "Create NA Invoice",
};

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function CreateNaInvoicePage({ searchParams }: Props) {
  const { edit } = await searchParams;
  const editId = Number(edit ?? "");
  const existingRecord =
    Number.isInteger(editId) && editId > 0 ? await getNaInvoiceById(editId) : null;
  const existing = existingRecord ? invoiceRecordToDocument(existingRecord) : null;
  const { customers, farmers, banks } = await getInvoiceBuilderData();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <NaInvoiceForm customers={customers} farmers={farmers} banks={banks} existing={existing} />
      </div>
    </ToastProvider>
  );
}
