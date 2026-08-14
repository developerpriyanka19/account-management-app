"use client";

import { useRef, useTransition } from "react";
import { deleteCustomer } from "../actions";

type Props = {
  customerId: number;
  label: string;
  className?: string;
};

export function DeleteCustomerButton({ customerId, label, className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function confirmDelete() {
    startTransition(() => {
      void deleteCustomer(customerId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`inline-flex h-8 items-center justify-center rounded-md border border-[#DC2626]/30 bg-white px-3 text-xs font-medium text-[#DC2626] transition hover:bg-red-50 ${className ?? ""}`}
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="no-print w-[min(100%,24rem)] rounded-lg border border-[#D1D5DB] bg-white p-0 text-[#111827] shadow-xl backdrop:bg-black/40"
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
            onClick={close}
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-xs font-medium text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-md bg-[#DC2626] px-4 text-xs font-medium text-white hover:bg-[#B91C1C] disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}
