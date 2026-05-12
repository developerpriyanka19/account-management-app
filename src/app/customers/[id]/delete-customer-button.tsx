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
        className={`inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40 ${className ?? ""}`}
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="no-print w-[min(100%,24rem)] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">Delete customer</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Delete <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span>?
            This cannot be undone.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}
