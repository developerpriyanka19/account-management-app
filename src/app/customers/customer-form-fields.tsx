import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";
import { CustomerAlignedRows } from "./customer-aligned-rows";

type Props = {
  fieldErrors?: CustomerFormFieldErrors;
  defaultValues: Record<string, string>;
};

export function CustomerFormFields({ fieldErrors, defaultValues }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CustomerAlignedRows
        mode="form"
        defaultValues={defaultValues}
        fieldErrors={fieldErrors}
      />
      <p className="text-xs text-[#6B7280]">
        <span className="text-red-500">*</span> Required: Farmers Name, Vendor Code, Survey No.
        Numbers can include decimals; leave blank when not applicable.
      </p>
    </div>
  );
}
