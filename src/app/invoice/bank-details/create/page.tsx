import type { Metadata } from "next";
import { ToastProvider } from "@/components/customer/toast";
import { CreateBankDetailsClient } from "./create-bank-details-client";

export const metadata: Metadata = { title: "Add Bank Details" };

export default function CreateBankDetailsPage() {
  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <CreateBankDetailsClient />
      </div>
    </ToastProvider>
  );
}
