"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@prisma/client";
import {
  cellText,
  formatAmount,
  formatOptionalDate,
} from "@/lib/customer-display";
import {
  computeFarmerDerivedFields,
  formatComputedTotal,
  type FarmerDerivedFields,
} from "@/lib/customer-computed-totals";
import { CUSTOMER_FIELD_LAYOUT } from "@/lib/customer-field-layout";
import { k2ChallanFromCustomer } from "@/lib/customer-serialize";
import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";

const inputClass =
  "block w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const numClass = `${inputClass} tabular-nums font-mono`;

const readOnlyClass =
  "block w-full rounded-md border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-2 text-sm tabular-nums font-mono text-[#111827] cursor-default";

const COMPUTED_FIELD_SET = new Set<string>([
  "totalGunta",
  "totalCents",
  "rentAmount",
  "balanceRentAmount",
  "shortageAmountTotal",
  "totalGovtFee",
]);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-[#DC2626]" role="alert">
      {message}
    </p>
  );
}

function AmountCell({ formatted }: { formatted: string }) {
  if (formatted === "—") {
    return <span className="font-mono text-[#6B7280]">—</span>;
  }
  return <span className="font-mono font-medium text-[#16A34A]">{formatted}</span>;
}

function ExtentCell({ formatted }: { formatted: string }) {
  if (formatted === "—") {
    return <span className="font-mono text-[#6B7280]">—</span>;
  }
  return <span className="font-mono text-[#111827]">{formatted}</span>;
}

function derivedInputFromForm(values: Record<string, string>) {
  return {
    leaseExtentAcre: values.leaseExtentAcre,
    leaseExtentGunta: values.leaseExtentGunta,
    rentPerAcre: values.rentPerAcre,
    aesAdvanceChequeAmount: values.aesAdvanceChequeAmount,
    shortageChequeAmount: values.shortageChequeAmount,
    shortageAmountSecondTime: values.shortageAmountSecondTime,
    shortageThirdChequeAmount: values.shortageThirdChequeAmount,
    atlTotal: values.atlTotal,
    paoTotal: values.paoTotal,
    landConversion: values.landConversion,
    otherRecoveries: values.otherRecoveries,
    podiFee: values.podiFee,
    leaseDeedStampDuty: values.leaseDeedGovtFee,
    leaseDeedRegCharges: 0,
  };
}

function derivedInputFromCustomer(customer: Customer) {
  return {
    leaseExtentAcre: customer.leaseExtentAcre,
    leaseExtentGunta: customer.leaseExtentGunta,
    rentPerAcre: customer.rentPerAcre,
    aesAdvanceChequeAmount: customer.aesAdvanceChequeAmount,
    shortageChequeAmount: customer.shortageChequeAmount,
    shortageAmountSecondTime: customer.shortageAmountSecondTime,
    shortageThirdChequeAmount: customer.shortageThirdChequeAmount,
    atlTotal: customer.atlTotal,
    paoTotal: customer.paoTotal,
    landConversion: customer.landConversion,
    otherRecoveries: customer.otherRecoveries,
    podiFee: customer.podiFee,
    leaseDeedStampDuty: customer.leaseDeedStampDuty,
    leaseDeedRegCharges: customer.leaseDeedRegCharges,
  };
}

function formatFieldValue(
  customer: Customer,
  name: string,
  variant?: "money" | "extent" | "text",
  derived?: FarmerDerivedFields,
): string {
  if (COMPUTED_FIELD_SET.has(name) && derived) {
    const raw = derived[name as keyof FarmerDerivedFields];
    if (variant === "money") {
      return formatAmount(raw);
    }
    return formatComputedTotal(raw) || "—";
  }
  if (name === "leaseDeedGovtFee") {
    const k2 = k2ChallanFromCustomer(customer);
    return k2 === "" ? "—" : formatAmount(Number(k2));
  }
  if (name === "remark") {
    return cellText(customer.notes);
  }
  const raw = customer[name as keyof Customer];
  if (variant === "money" || variant === "extent") {
    return formatAmount(raw as number | null | undefined);
  }
  if (name.endsWith("Date")) {
    return formatOptionalDate(raw as string | null | undefined);
  }
  return cellText(raw as string | null | undefined);
}

type FormProps = {
  mode: "form";
  defaultValues: Record<string, string>;
  fieldErrors?: CustomerFormFieldErrors;
};

type DisplayProps = {
  mode: "display";
  customer: Customer;
};

type Props = FormProps | DisplayProps;

export function CustomerAlignedRows(props: Props) {
  const initialFormValues =
    props.mode === "form" ? props.defaultValues : ({} as Record<string, string>);

  const [formValues, setFormValues] = useState<Record<string, string>>(initialFormValues);

  useEffect(() => {
    if (props.mode === "form") {
      setFormValues(props.defaultValues);
    }
  }, [props.mode, props.mode === "form" ? props.defaultValues : null]);

  const formDerived = useMemo(
    () =>
      props.mode === "form"
        ? computeFarmerDerivedFields(derivedInputFromForm(formValues))
        : null,
    [props.mode, formValues],
  );

  const displayDerived = useMemo(
    () =>
      props.mode === "display"
        ? computeFarmerDerivedFields(derivedInputFromCustomer(props.customer))
        : null,
    [props.mode, props.mode === "display" ? props.customer : null],
  );

  function updateField(name: string, value: string) {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  const e =
    props.mode === "form" ? (key: string) => props.fieldErrors?.[key] : () => undefined;

  return (
    <div className="overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
      <div>
        {CUSTOMER_FIELD_LAYOUT.map((row, index) => {
          if (row.row === "parent") {
            return (
              <div
                key={`parent-${row.label}-${index}`}
                className="grid grid-cols-2 border-b border-[#D1D5DB] bg-[#EEF2FF] px-4 py-2"
              >
                <div
                  className={`text-center text-xs font-bold sm:text-left ${
                    row.headerTone === "red" ? "text-[#DC2626]" : "text-[#111827]"
                  }`}
                >
                  {row.label}
                </div>
                <div aria-hidden />
              </div>
            );
          }

          const id = row.name;
          const error = props.mode === "form" ? e(id) : undefined;
          const derived = props.mode === "form" ? formDerived : displayDerived;
          const isComputed = row.computed === true;
          const computedValue =
            isComputed && derived
              ? formatComputedTotal(derived[id as keyof FarmerDerivedFields])
              : "";
          const displayValue =
            props.mode === "display"
              ? formatFieldValue(props.customer, row.name, row.variant, derived ?? undefined)
              : null;
          const zebra = index % 2 === 1;

          return (
            <div
              key={id}
              className={`grid grid-cols-2 items-center border-b border-[#D1D5DB] px-4 py-2 ${
                zebra ? "bg-[#FAFBFC]" : "bg-white"
              }`}
            >
              <label
                htmlFor={props.mode === "form" && !isComputed ? id : undefined}
                className="text-xs font-medium text-[#6B7280]"
              >
                {row.label}
                {props.mode === "form" && row.required ? (
                  <span className="text-[#DC2626]"> *</span>
                ) : null}
              </label>
              <div className="min-w-0">
                {props.mode === "form" ? (
                  <>
                    {isComputed ? (
                      <>
                        <input type="hidden" name={id} value={computedValue} />
                        <div
                          className={readOnlyClass}
                          aria-readonly
                          title="Calculated automatically"
                        >
                          {computedValue || "0.00"}
                        </div>
                      </>
                    ) : row.inputType === "date" ? (
                      <input
                        id={id}
                        name={id}
                        type="date"
                        defaultValue={formValues[id] ?? ""}
                        onChange={(ev) => updateField(id, ev.target.value)}
                        className={inputClass}
                      />
                    ) : row.inputType === "number" ? (
                      <input
                        id={id}
                        name={id}
                        type="text"
                        inputMode="decimal"
                        defaultValue={formValues[id] ?? ""}
                        onChange={(ev) => updateField(id, ev.target.value)}
                        className={numClass}
                      />
                    ) : (
                      <input
                        id={id}
                        name={id}
                        type="text"
                        defaultValue={formValues[id] ?? ""}
                        onChange={(ev) => updateField(id, ev.target.value)}
                        className={inputClass}
                      />
                    )}
                    <FieldError message={error} />
                  </>
                ) : row.variant === "money" ? (
                  <AmountCell formatted={displayValue ?? "—"} />
                ) : row.variant === "extent" ? (
                  <ExtentCell formatted={displayValue ?? "—"} />
                ) : (
                  <span className="text-sm text-[#111827]">{displayValue}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
