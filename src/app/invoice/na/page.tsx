import type { Metadata } from "next";
import { getInvoiceBuilderData } from "@/app/invoice/actions";
import { InvoiceBuilder } from "@/components/invoice/invoice-builder";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = {
  title: "NA Invoice",
};

export default async function NaInvoicePage() {
  const { customers, farmers, nextSequence } = await getInvoiceBuilderData();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <InvoiceBuilder
          category="na"
          title="NA Invoice"
          customers={customers}
          farmers={farmers}
          nextSequence={nextSequence}
        />
      </div>
    </ToastProvider>
  );
}
