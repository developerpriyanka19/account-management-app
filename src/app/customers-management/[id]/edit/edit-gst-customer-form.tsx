"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateGstCustomer } from "@/app/customers-management/actions";
import { CustomerForm } from "@/components/customer/customer-form";
import type { CustomerFormValues } from "@/lib/validators/customer";
import { useToast } from "@/components/customer/toast";

type Props = {
  customerId: number;
  initialValues: CustomerFormValues;
};

export function EditGstCustomerForm({ customerId, initialValues }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(values: CustomerFormValues) {
    startTransition(async () => {
      const result = await updateGstCustomer(customerId, values);
      if (!result.ok) {
        setServerFieldErrors(result.fieldErrors ?? {});
        if (result.message) toast.error(result.message);
        return;
      }
      toast.success("Customer updated successfully.");
      router.push(`/customers-management/${customerId}`);
    });
  }

  return (
    <CustomerForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      serverFieldErrors={serverFieldErrors}
      pending={pending}
      submitLabel="Save Changes"
    />
  );
}
