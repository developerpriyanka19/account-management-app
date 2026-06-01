import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";
import { FarmerDebitNotesEditor } from "@/components/farmer/farmer-debit-notes-editor";
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
      <CustomerAlignedRows
        mode="form"
        defaultValues={defaultValues}
        fieldErrors={fieldErrors}
      />
      <FarmerDebitNotesEditor initialNotes={initialDebitNotes} />
      <p className="text-xs text-[#6B7280]">
        <span className="text-red-500">*</span> Required: Farmers Name, Vendor Code, Survey No.
        Numbers can include decimals; leave blank when not applicable.
      </p>
    </div>
  );
}
