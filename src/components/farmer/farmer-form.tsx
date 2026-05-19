"use client";

import { useActionState, useMemo } from "react";
import { createCustomer, type CreateCustomerState } from "@/app/farmer/actions";
import { FarmerFormActions } from "@/components/farmer/farmer-form-actions";
import { FarmerFormFields } from "@/components/farmer/farmer-form-fields";
import { emptyCustomerFormValues } from "@/lib/customer-serialize";

const initialState: CreateCustomerState = {};

/** Create / edit form for farmer (land) records. No GST lookup. */
export function FarmerForm() {
  const [state, formAction, isPending] = useActionState(createCustomer, initialState);

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
      <FarmerFormFields fieldErrors={state.fieldErrors} defaultValues={defaultValues} />
      <FarmerFormActions
        cancelHref="/farmer"
        submitLabel="Save farmer"
        pendingLabel="Saving…"
        isPending={isPending}
      />
    </form>
  );
}
