"use client";

import type { BankDetailsOption } from "@/lib/bank-details-types";
import { Label } from "@/components/ui/label";

type Props = {
  banks: BankDetailsOption[];
  value: number | "";
  onChange: (id: number | "") => void;
  disabled?: boolean;
};

export function BankAccountSelect({ banks, value, onChange, disabled }: Props) {
  return (
    <div>
      <Label>Bank Account *</Label>
      <select
        value={value === "" ? "" : String(value)}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        disabled={disabled || banks.length === 0}
        className="mt-1 flex h-9 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827]"
      >
        <option value="">Select bank account…</option>
        {banks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
      {banks.length === 0 ? (
        <p className="mt-1 text-xs text-[#6B7280]">
          No active bank accounts. Add one under Invoice → Bank Details.
        </p>
      ) : null}
    </div>
  );
}
