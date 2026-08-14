"use client";

import { useActionState, useMemo } from "react";
import type { Customer } from "@prisma/client";
import { customerToFormValues } from "@/lib/customer-serialize";
import type { FarmerDebitNoteInput } from "@/lib/farmer-debit-notes";
import { updateCustomer, type UpdateCustomerState } from "../../actions";
import { CustomerFormActions } from "../../customer-form-actions";
import { CustomerFormFields } from "../../customer-form-fields";

const initialState: UpdateCustomerState = {};

type Props = {
  customer: Customer;
  initialDebitNotes: FarmerDebitNoteInput[];
};

export function EditCustomerForm({ customer, initialDebitNotes }: Props) {
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

  const debitNotesForForm = useMemo<FarmerDebitNoteInput[]>(
    () =>
      initialDebitNotes.map((n) => ({
        id: n.id,
        category: n.category,
        dbNo: n.dbNo ?? "",
        amount: n.amount,
        remark: n.remark ?? "",
      })),
    [initialDebitNotes],
  );

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="customerId" value={customer.id} />
      <CustomerFormFields
        fieldErrors={state.fieldErrors}
        defaultValues={defaultValues}
        initialDebitNotes={debitNotesForForm}
      />
      <CustomerFormActions
        cancelHref={`/farmer/${customer.id}`}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        isPending={isPending}
      />
    </form>
  );
}
