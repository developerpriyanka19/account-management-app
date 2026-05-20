"use client";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  customerFormSchema,
  emptyCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/validators/customer";
import { normalizeGstNumber } from "@/lib/validators/gst";

export type { CustomerFormValues };

type Props = {
  initialValues?: CustomerFormValues;
  serverFieldErrors?: Record<string, string>;
  onSubmit: (values: CustomerFormValues) => void;
  submitLabel?: string;
  pending?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-[#DC2626]">{message}</p>;
}

/** Billing customer form — manual entry only (no external GST API). */
export function CustomerForm({
  initialValues,
  serverFieldErrors = {},
  onSubmit,
  submitLabel = "Save Customer",
  pending = false,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialValues ?? emptyCustomerFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const fieldError = useCallback(
    (name: keyof CustomerFormValues) =>
      serverFieldErrors[name] ?? errors[name]?.message,
    [serverFieldErrors, errors],
  );

  const onValid = (values: CustomerFormValues) => {
    onSubmit({
      ...values,
      gstNumber: normalizeGstNumber(values.gstNumber),
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      <p className="text-xs text-[#6B7280]">
        Enter customer and GST details for invoice Bill To section. GST number, state, district, and
        PIN code are required.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register("firstName")} className="mt-1 h-9" />
          <FieldError message={fieldError("firstName")} />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register("lastName")} className="mt-1 h-9" />
          <FieldError message={fieldError("lastName")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="gstNumber">GST Number *</Label>
          <Input
            id="gstNumber"
            {...register("gstNumber", {
              onChange: (e) => {
                e.target.value = normalizeGstNumber(e.target.value);
              },
            })}
            placeholder="15-digit GSTIN"
            maxLength={15}
            className="mt-1 h-9 font-mono uppercase"
          />
          <FieldError message={fieldError("gstNumber")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input id="companyName" {...register("companyName")} className="mt-1 h-9" />
          <FieldError message={fieldError("companyName")} />
        </div>
        <div>
          <Label htmlFor="buildingNumber">Building No./Flat No</Label>
          <Input id="buildingNumber" {...register("buildingNumber")} className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="street">Road/Street</Label>
          <Input id="street" {...register("street")} className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="locality">Locality/Sub Locality</Label>
          <Input id="locality" {...register("locality")} className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="village">City/Town/Village</Label>
          <Input id="village" {...register("village")} className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="district">District *</Label>
          <Input id="district" {...register("district")} className="mt-1 h-9" />
          <FieldError message={fieldError("district")} />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input id="state" {...register("state")} className="mt-1 h-9" />
          <FieldError message={fieldError("state")} />
        </div>
        <div>
          <Label htmlFor="pincode">PIN Code *</Label>
          <Input
            id="pincode"
            {...register("pincode")}
            placeholder="6 digits"
            maxLength={6}
            className="mt-1 h-9 font-mono"
          />
          <FieldError message={fieldError("pincode")} />
        </div>
        <div>
          <Label htmlFor="gstStatus">GST Status</Label>
          <Input id="gstStatus" {...register("gstStatus")} className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="panNumber">PAN Number</Label>
          <Input
            id="panNumber"
            {...register("panNumber", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
            className="mt-1 h-9 font-mono uppercase"
            maxLength={10}
          />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input id="mobile" type="tel" {...register("mobile")} className="mt-1 h-9" />
          <FieldError message={fieldError("mobile")} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} className="mt-1 h-9" />
          <FieldError message={fieldError("email")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="companyAddress">Legacy address note (optional)</Label>
          <Textarea
            id="companyAddress"
            {...register("companyAddress")}
            className="mt-1"
            rows={2}
            placeholder="Optional — invoice uses structured fields above"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" {...register("notes")} className="mt-1" rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#E5E7EB] pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
