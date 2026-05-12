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

  const secondary =
    "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

  const primary =
    "inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

  return (
    <div className="no-print flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Link
        href="/customers"
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-transparent px-1 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <span aria-hidden className="text-base leading-none">
          ←
        </span>
        Back
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={secondary} onClick={openPrint}>
          Print
        </button>
        <button
          type="button"
          className={secondary}
          onClick={openPrint}
          title="Opens the print dialog — choose Save as PDF as the destination."
        >
          Save as PDF
        </button>
        <Link href={`/customers/${customerId}/edit`} className={primary}>
          Edit
        </Link>
        <DeleteCustomerButton
          customerId={customerId}
          label={deleteLabel}
          className="h-9 border-red-200 px-3 text-sm dark:border-red-900/60"
        />
      </div>
    </div>
  );
}
