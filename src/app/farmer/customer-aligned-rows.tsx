"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@prisma/client";
import {
  cellText,
  formatAmount,
  formatOptionalDate,
} from "@/lib/customer-display";
import {
  computeTotalCents,
  computeTotalGunta,
  computeTotalRent,
  computeShortageAmountTotal,
  formatComputedTotal,
} from "@/lib/customer-computed-totals";
import { CUSTOMER_FIELD_LAYOUT } from "@/lib/customer-field-layout";
import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";

const inputClass =
  "block w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const numClass = `${inputClass} tabular-nums font-mono`;

const computedReadOnlyClass =
  "block w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm tabular-nums font-mono text-[#111827]";

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

function formatFieldValue(
  customer: Customer,
  name: string,
  variant?: "money" | "extent" | "text",
): string {
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

  const computedTotals = useMemo(() => {
    if (props.mode !== "form") return { totalGunta: "", totalCents: "", rentAmount: "", shortageAmountTotal: "" };
    const input = {
      rtcExtentAcre: formValues.rtcExtentAcre,
      rtcExtentGunta: formValues.rtcExtentGunta,
      balanceExtentAcre: formValues.balanceExtentAcre,
      balanceExtentGunta: formValues.balanceExtentGunta,
      leaseExtentAcre: formValues.leaseExtentAcre,
      leaseExtentGunta: formValues.leaseExtentGunta,
      rentPerAcre: formValues.rentPerAcre,
    };
    return {
      totalGunta: formatComputedTotal(computeTotalGunta(input)),
      totalCents: formatComputedTotal(computeTotalCents(input)),
      rentAmount: formatComputedTotal(computeTotalRent(input)),
      shortageAmountTotal: formatComputedTotal(
        computeShortageAmountTotal({
          shortageChequeAmount: formValues.shortageChequeAmount,
          shortageAmountSecondTime: formValues.shortageAmountSecondTime,
          shortageThirdChequeAmount: formValues.shortageThirdChequeAmount,
        }),
      ),
    };
  }, [props.mode, formValues]);

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
          const isComputed = row.computed === true;
          const displayValue =
            props.mode === "display"
              ? formatFieldValue(props.customer, row.name, row.variant)
              : null;
          const zebra = index % 2 === 1;
          const computedValue =
            id === "totalGunta"
              ? computedTotals.totalGunta
              : id === "totalCents"
                ? computedTotals.totalCents
                : id === "rentAmount"
                  ? computedTotals.rentAmount
                  : id === "shortageAmountTotal"
                    ? computedTotals.shortageAmountTotal
                    : "";

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
                        <div className={computedReadOnlyClass} aria-live="polite">
                          {computedValue || "—"}
                        </div>
                        <input type="hidden" name={id} value={computedValue} />
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
