"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createGstCustomer } from "@/app/customers-management/actions";
import { CustomerForm } from "@/components/customer/customer-form";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CustomerFormValues } from "@/lib/validators/customer";

export function CustomerModal() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(values: CustomerFormValues) {
    startTransition(async () => {
      const result = await createGstCustomer(values);
      if (!result.ok) {
        setServerFieldErrors(result.fieldErrors ?? {});
        if (result.message) toast.error(result.message);
        return;
      }
      toast.success("Customer added successfully.");
      setServerFieldErrors({});
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Enter customer and GST details manually.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          onSubmit={handleSubmit}
          serverFieldErrors={serverFieldErrors}
          pending={pending}
          submitLabel="Add Customer"
        />
      </DialogContent>
    </Dialog>
  );
}
