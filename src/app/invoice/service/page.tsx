import type { Metadata } from "next";
import { getInvoiceBuilderData } from "@/app/invoice/actions";
import { InvoiceBuilder } from "@/components/invoice/invoice-builder";
import { ToastProvider } from "@/components/customer/toast";

export const metadata: Metadata = {
  title: "Service Invoice",
};

export default async function ServiceInvoicePage() {
  const { customers, farmers, nextSequence } = await getInvoiceBuilderData();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <InvoiceBuilder
          category="service"
          title="Service Invoice"
          customers={customers}
          farmers={farmers}
          nextSequence={nextSequence}
        />
      </div>
    </ToastProvider>
  );
}
