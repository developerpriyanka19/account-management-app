"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBankDetail } from "@/actions/bank-details-actions";
import { BankDetailsForm } from "@/components/bank/bank-details-form";
import { useToast } from "@/components/customer/toast";
import type { BankDetailsFormValues, BankDetailsRow } from "@/lib/bank-details-types";

type Props = {
  bank: BankDetailsRow;
};

export function EditBankDetailsClient({ bank }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(values: BankDetailsFormValues) {
    startTransition(async () => {
      const result = await updateBankDetail(bank.id, values);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success("Bank details updated.");
      router.push("/invoice/bank-details");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/invoice/bank-details"
        className="text-sm font-medium text-[#2563EB] hover:underline"
      >
        ← Back to Bank Details
      </Link>
      <h1 className="text-xl font-semibold text-[#111827]">Edit Bank Details</h1>
      <BankDetailsForm
        initial={bank}
        onSubmit={handleSubmit}
        submitLabel="Update Bank Details"
        pending={pending}
        serverFieldErrors={fieldErrors}
      />
    </div>
  );
}
