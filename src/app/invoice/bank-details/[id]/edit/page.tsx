import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBankDetailById } from "@/actions/bank-details-actions";
import { ToastProvider } from "@/components/customer/toast";
import { EditBankDetailsClient } from "./edit-bank-details-client";

export const metadata: Metadata = { title: "Edit Bank Details" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBankDetailsPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const bank = await getBankDetailById(id);
  if (!bank) notFound();

  return (
    <ToastProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EditBankDetailsClient bank={bank} />
      </div>
    </ToastProvider>
  );
}
