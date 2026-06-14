"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankDetailsFormValues, BankDetailsRow } from "@/lib/bank-details-types";

type Props = {
  initial?: BankDetailsRow | null;
  onSubmit: (values: BankDetailsFormValues) => void | Promise<void>;
  submitLabel: string;
  pending?: boolean;
  serverFieldErrors?: Record<string, string>;
};

function valuesFromRow(row: BankDetailsRow): BankDetailsFormValues {
  return {
    bankName: row.bankName,
    accountHolderName: row.accountHolderName,
    accountNumber: row.accountNumber,
    confirmAccountNumber: row.accountNumber,
    ifscCode: row.ifscCode,
    branchName: row.branchName ?? "",
    isActive: row.isActive,
    isDefault: row.isDefault,
  };
}

export function BankDetailsForm({
  initial,
  onSubmit,
  submitLabel,
  pending: externalPending,
  serverFieldErrors = {},
}: Props) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<BankDetailsFormValues>(
    initial ? valuesFromRow(initial) : {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      branchName: "",
      isActive: true,
      isDefault: false,
    },
  );
  const isPending = pending || externalPending;

  function fieldError(name: keyof BankDetailsFormValues) {
    return serverFieldErrors[name];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await onSubmit({
        ...values,
        ifscCode: values.ifscCode.trim().toUpperCase(),
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Bank Name *</Label>
          <Input
            value={values.bankName}
            onChange={(e) => setValues((v) => ({ ...v, bankName: e.target.value }))}
            className="mt-1"
          />
          {fieldError("bankName") ? (
            <p className="mt-1 text-xs text-[#DC2626]">{fieldError("bankName")}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label>Account Holder Name *</Label>
          <Input
            value={values.accountHolderName}
            onChange={(e) => setValues((v) => ({ ...v, accountHolderName: e.target.value }))}
            className="mt-1"
          />
          {fieldError("accountHolderName") ? (
            <p className="mt-1 text-xs text-[#DC2626]">{fieldError("accountHolderName")}</p>
          ) : null}
        </div>
        <div>
          <Label>Account Number *</Label>
          <Input
            value={values.accountNumber}
            onChange={(e) => setValues((v) => ({ ...v, accountNumber: e.target.value }))}
            className="mt-1"
          />
          {fieldError("accountNumber") ? (
            <p className="mt-1 text-xs text-[#DC2626]">{fieldError("accountNumber")}</p>
          ) : null}
        </div>
        <div>
          <Label>Confirm Account Number *</Label>
          <Input
            value={values.confirmAccountNumber}
            onChange={(e) => setValues((v) => ({ ...v, confirmAccountNumber: e.target.value }))}
            className="mt-1"
          />
          {fieldError("confirmAccountNumber") ? (
            <p className="mt-1 text-xs text-[#DC2626]">{fieldError("confirmAccountNumber")}</p>
          ) : null}
        </div>
        <div>
          <Label>IFSC Code *</Label>
          <Input
            value={values.ifscCode}
            onChange={(e) =>
              setValues((v) => ({ ...v, ifscCode: e.target.value.toUpperCase().slice(0, 11) }))
            }
            className="mt-1 uppercase"
            maxLength={11}
          />
          {fieldError("ifscCode") ? (
            <p className="mt-1 text-xs text-[#DC2626]">{fieldError("ifscCode")}</p>
          ) : null}
        </div>
        <div>
          <Label>Branch Name</Label>
          <Input
            value={values.branchName}
            onChange={(e) => setValues((v) => ({ ...v, branchName: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-[#D1D5DB]"
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isDefault}
            onChange={(e) => setValues((v) => ({ ...v, isDefault: e.target.checked }))}
            className="h-4 w-4 rounded border-[#D1D5DB]"
          />
          Default Bank
        </label>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
