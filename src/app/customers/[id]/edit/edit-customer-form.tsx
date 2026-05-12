"use client";

import { useActionState, useMemo } from "react";
import Link from "next/link";
import type { Customer } from "@prisma/client";
import { customerToFormValues } from "@/lib/customer-serialize";
import { updateCustomer, type UpdateCustomerState } from "../../actions";
import { CustomerFormFields } from "../../customer-form-fields";

const initialState: UpdateCustomerState = {};

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const [state, formAction, isPending] = useActionState(
    updateCustomer,
    initialState,
  );

  const formKey =
    state.fieldErrors && state.values
      ? JSON.stringify({ e: state.fieldErrors, v: state.values })
      : "initial";

  const defaultValues = useMemo(() => {
    const base = customerToFormValues(customer);
    if (state.values) {
      return { ...base, ...state.values };
    }
    return base;
  }, [customer, state.values]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="customerId" value={customer.id} />

      <CustomerFormFields fieldErrors={state.fieldErrors} defaultValues={defaultValues} />

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:justify-end">
        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
