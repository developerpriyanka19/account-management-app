"use client";

import { useRef, useTransition } from "react";
import { deleteGstCustomer } from "@/app/customers-management/actions";

type Props = {
  customerId: number;
  label: string;
};

export function DeleteGstCustomerButton({ customerId, label }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-7 items-center rounded px-2 text-[13px] font-medium text-[#DC2626] hover:bg-red-50"
      >
        Delete
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(100%,24rem)] rounded-lg border border-[#D1D5DB] bg-white p-0 text-[#111827] shadow-xl backdrop:bg-black/40"
      >
        <div className="border-b border-[#D1D5DB] px-5 py-4">
          <h2 className="text-base font-semibold">Delete customer</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Delete <span className="font-medium text-[#111827]">{label}</span>? This cannot be
            undone.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md border border-[#D1D5DB] bg-white px-4 text-xs font-medium hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => void deleteGstCustomer(customerId))}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md bg-[#DC2626] px-4 text-xs font-medium text-white hover:bg-[#B91C1C] disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
