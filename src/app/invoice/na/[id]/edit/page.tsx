import { notFound, redirect } from "next/navigation";
import { getInvoiceBuilderData, getNaInvoiceById } from "@/app/invoice/actions";
import { NaInvoiceForm } from "@/components/invoice/na-invoice-form";
import { ToastProvider } from "@/components/customer/toast";
import { invoiceRecordToDocument } from "@/lib/invoice-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditNaInvoicePage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const record = await getNaInvoiceById(id);
  if (!record) notFound();
  if ((record.status ?? "").toUpperCase() === "FINAL") {
    redirect(`/invoice/na/${id}`);
  }

  const existing = invoiceRecordToDocument(record);
  const { customers, farmers } = await getInvoiceBuilderData();
  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <NaInvoiceForm
          customers={customers}
          farmers={farmers}
          existing={existing}
        />
      </div>
    </ToastProvider>
  );
}
