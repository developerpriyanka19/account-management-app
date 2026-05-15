"use client";

import Link from "next/link";
import { DeleteCustomerButton } from "./delete-customer-button";

type Props = {
  customerId: number;
  deleteLabel: string;
};

export function CustomerDetailToolbar({ customerId, deleteLabel }: Props) {
  function openPrint() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={openPrint}
        className="inline-flex h-8 items-center rounded-md border border-[#D1D5DB] bg-white px-3 text-xs font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
      >
        Print
      </button>
      <Link
        href={`/customers/${customerId}/edit`}
        className="inline-flex h-8 items-center rounded-md bg-[#2563EB] px-3 text-xs font-medium text-white transition hover:bg-[#1D4ED8]"
      >
        Edit
      </Link>
      <DeleteCustomerButton
        customerId={customerId}
        label={deleteLabel}
        className="!h-8 !rounded-md !border-[#DC2626]/30 !bg-white !px-3 !text-xs !text-[#DC2626] hover:!bg-red-50"
      />
    </>
  );
}
