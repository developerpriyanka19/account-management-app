"use client";

import { useActionState, useMemo } from "react";
import { createCustomer, type CreateCustomerState } from "../actions";
import { CustomerFormActions } from "../customer-form-actions";
import { CustomerFormFields } from "../customer-form-fields";
import { emptyCustomerFormValues } from "@/lib/customer-serialize";

const initialState: CreateCustomerState = {};

export function CustomerForm() {
  const [state, formAction, isPending] = useActionState(
    createCustomer,
    initialState,
  );

  const formKey =
    state.fieldErrors && state.values
      ? JSON.stringify({ e: state.fieldErrors, v: state.values })
      : "initial";

  const defaultValues = useMemo(() => {
    const base = emptyCustomerFormValues();
    if (state.values) {
      return { ...base, ...state.values };
    }
    return base;
  }, [state.values]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <CustomerFormFields fieldErrors={state.fieldErrors} defaultValues={defaultValues} />
      <CustomerFormActions
        cancelHref="/customers"
        submitLabel="Save customer"
        pendingLabel="Saving…"
        isPending={isPending}
      />
    </form>
  );
}
