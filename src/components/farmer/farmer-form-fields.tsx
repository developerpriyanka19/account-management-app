import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";
import { CustomerAlignedRows } from "@/app/farmer/customer-aligned-rows";
import { FarmerDebitNotesEditor } from "@/components/farmer/farmer-debit-notes-editor";
import { FarmerLocationFields } from "@/components/farmer/farmer-location-fields";

type Props = {
  fieldErrors?: CustomerFormFieldErrors;
  defaultValues: Record<string, string>;
};

export function FarmerFormFields({ fieldErrors, defaultValues }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <FarmerLocationFields
        mode="form"
        defaultValues={defaultValues}
        fieldErrors={fieldErrors}
      />
      <CustomerAlignedRows
        mode="form"
        defaultValues={defaultValues}
        fieldErrors={fieldErrors}
      />
      <FarmerDebitNotesEditor />
      <p className="text-xs text-[#6B7280]">
        <span className="text-red-500">*</span> Required: State, District, Taluk, Hobli, Village,
        Farmers Name, Vendor Code, Survey No. Numbers can include decimals; leave blank when not
        applicable.
      </p>
    </div>
  );
}
