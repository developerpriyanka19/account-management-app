import type { Metadata } from "next";
import { getInvoiceBuilderData } from "@/app/invoice/actions";
import { ToastProvider } from "@/components/customer/toast";
import { QuotationForm } from "@/components/quotation/quotation-form";

export const metadata: Metadata = {
  title: "Quotation",
};

export default async function QuotationPage() {
  const { customers } = await getInvoiceBuilderData();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <QuotationForm customers={customers} />
      </div>
    </ToastProvider>
  );
}
