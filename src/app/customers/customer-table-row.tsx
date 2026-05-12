"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { cellText, formatAmount } from "@/lib/customer-display";
import { DeleteCustomerButton } from "./[id]/delete-customer-button";

export type CustomerListRowData = {
  id: number;
  farmerName: string | null;
  changedFarmerName: string | null;
  vendorCode: string | null;
  surveyNo: string | null;
  newSurveyNo: string | null;
  totalGunta: number | null;
  leaseAmount: number | null;
  rentAmount: number | null;
  balanceReceivable: number | null;
  loanAmount: number | null;
};

const actionLinkClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export function CustomerTableRow({ customer }: { customer: CustomerListRowData }) {
  const router = useRouter();
  const label = cellText(customer.farmerName);
  const deleteLabel = label === "—" ? `Customer #${customer.id}` : label;

  function goToDetail() {
    router.push(`/customers/${customer.id}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetail();
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`View customer ${deleteLabel}`}
      className="cursor-pointer border-b border-zinc-100 bg-white transition-colors hover:bg-zinc-50/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/55 dark:focus-visible:ring-zinc-500"
      onClick={goToDetail}
      onKeyDown={onKeyDown}
    >
      <td className="sticky left-0 z-10 max-w-[12rem] truncate border-r border-zinc-100 bg-inherit px-3 py-3 pl-4 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 sm:max-w-[14rem] sm:pl-5">
        {label}
      </td>
      <td className="hidden max-w-[9rem] truncate px-3 py-3 text-sm text-zinc-700 md:table-cell dark:text-zinc-300 lg:max-w-[11rem]">
        {cellText(customer.changedFarmerName)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4">
        {cellText(customer.vendorCode)}
      </td>
      <td className="max-w-[8rem] truncate px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300 sm:max-w-none sm:px-4">
        {cellText(customer.surveyNo)}
      </td>
      <td className="hidden max-w-[8rem] truncate px-3 py-3 text-sm text-zinc-700 lg:table-cell dark:text-zinc-300">
        {cellText(customer.newSurveyNo)}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-zinc-900 xl:table-cell dark:text-zinc-100">
        {formatAmount(customer.totalGunta)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums font-medium text-emerald-900 dark:text-emerald-300/90 sm:px-4">
        {formatAmount(customer.leaseAmount)}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-zinc-900 md:table-cell dark:text-zinc-100">
        {formatAmount(customer.rentAmount)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums font-medium text-zinc-900 dark:text-zinc-100 sm:px-4">
        {formatAmount(customer.balanceReceivable)}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-zinc-900 xl:table-cell dark:text-zinc-100">
        {formatAmount(customer.loanAmount)}
      </td>
      <td
        className="sticky right-0 z-10 w-[1%] whitespace-nowrap border-l border-zinc-100 bg-inherit px-2 py-2 pl-3 shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.35)] sm:px-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Link
            href={`/customers/${customer.id}`}
            className={actionLinkClass}
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className={actionLinkClass}
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <DeleteCustomerButton
            customerId={customer.id}
            label={deleteLabel}
            className="!h-8 border-red-200 px-2.5 text-xs dark:border-red-900/60"
          />
        </div>
      </td>
    </tr>
  );
}
