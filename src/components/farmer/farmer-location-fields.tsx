"use client";

import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";

const inputClass =
  "block w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const LOCATION_FIELDS = [
  { name: "state", label: "State" },
  { name: "district", label: "District" },
  { name: "taluk", label: "Taluk" },
  { name: "hobbli", label: "Hobli" },
  { name: "village", label: "Village" },
] as const;

type Props = {
  mode: "form" | "display";
  defaultValues?: Record<string, string>;
  fieldErrors?: CustomerFormFieldErrors;
  displayValues?: {
    state?: string | null;
    district?: string | null;
    taluk?: string | null;
    hobbli?: string | null;
    village?: string | null;
  };
};

/**
 * Farmer master location row — shown above Farmer Name.
 * Not part of CUSTOMER_COLUMN_GROUPS (excluded from Dashboard table).
 */
export function FarmerLocationFields({
  mode,
  defaultValues,
  fieldErrors,
  displayValues,
}: Props) {
  if (mode === "display") {
    return (
      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">Location</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LOCATION_FIELDS.map((field) => {
            const raw = displayValues?.[field.name]?.trim();
            return (
              <div key={field.name}>
                <p className="text-xs font-medium text-[#6B7280]">{field.label}</p>
                <p className="mt-1 text-sm text-[#111827]">{raw || "—"}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[#111827]">Location</h2>
      <p className="mt-1 text-xs text-[#6B7280]">
        Enter the farmer location. All fields are required.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {LOCATION_FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="text-xs font-medium text-[#6B7280]">
              {field.label}
              <span className="text-[#DC2626]"> *</span>
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              required
              defaultValue={defaultValues?.[field.name] ?? ""}
              className={`${inputClass} mt-1`}
              autoComplete="off"
            />
            {fieldErrors?.[field.name] ? (
              <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                {fieldErrors[field.name]}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
