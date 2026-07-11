import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";
import { FarmerDebitNotesEditor } from "@/components/farmer/farmer-debit-notes-editor";
import { FarmerLocationFields } from "@/components/farmer/farmer-location-fields";
import type { FarmerDebitNoteInput } from "@/lib/farmer-debit-notes";
import { CustomerAlignedRows } from "./customer-aligned-rows";

type Props = {
  fieldErrors?: CustomerFormFieldErrors;
  defaultValues: Record<string, string>;
  initialDebitNotes?: FarmerDebitNoteInput[];
};

export function CustomerFormFields({
  fieldErrors,
  defaultValues,
  initialDebitNotes = [],
}: Props) {
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
      <FarmerDebitNotesEditor initialNotes={initialDebitNotes} />
      <p className="text-xs text-[#6B7280]">
        <span className="text-red-500">*</span> Required: State, District, Taluk, Hobli, Village,
        Farmers Name, Vendor Code, Survey No. Numbers can include decimals; leave blank when not
        applicable.
      </p>
    </div>
  );
}
