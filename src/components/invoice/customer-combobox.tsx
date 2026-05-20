"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InvoiceBillingCustomerOption } from "@/lib/invoice-types";

function customerDisplayName(c: InvoiceBillingCustomerOption): string {
  return c.companyName?.trim() || c.label;
}

function customerSearchHaystack(c: InvoiceBillingCustomerOption): string {
  return [
    c.label,
    c.companyName,
    c.gstNumber,
    c.firstName,
    c.lastName,
    `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

type Props = {
  customers: InvoiceBillingCustomerOption[];
  value: number;
  onChange: (customer: InvoiceBillingCustomerOption | null) => void;
  disabled?: boolean;
  error?: string;
};

export function CustomerCombobox({ customers, value, onChange, disabled, error }: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selected = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => customerSearchHaystack(c).includes(q));
  }, [customers, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function selectCustomer(customer: InvoiceBillingCustomerOption) {
    onChange(customer);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[highlightIndex]) {
      e.preventDefault();
      selectCustomer(filtered[highlightIndex]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative mt-1">
      <div className="flex gap-1">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder={selected ? customerDisplayName(selected) : "Search customer..."}
            value={open ? query : selected ? customerDisplayName(selected) : ""}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setQuery("");
              }
            }}
            onKeyDown={handleKeyDown}
            className={cn("pr-8", error && "border-red-500")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-0 top-0 h-9 w-9 shrink-0 text-[#6B7280]"
            onClick={() => {
              if (disabled) return;
              setOpen((o) => !o);
              if (!open) {
                setQuery("");
                inputRef.current?.focus();
              }
            }}
            aria-label="Toggle customer list"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
        {selected && !disabled ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={clearSelection}
            aria-label="Clear customer"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {selected && !open ? (
        <p className="mt-1 font-mono text-xs text-[#6B7280]">{selected.gstNumber}</p>
      ) : null}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[#6B7280]">No customers found</li>
          ) : (
            filtered.map((customer, index) => {
              const isSelected = customer.id === value;
              const isHighlighted = index === highlightIndex;
              return (
                <li key={customer.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                      isHighlighted && "bg-[#EFF6FF]",
                      isSelected && "bg-[#F0F9FF]",
                      !isHighlighted && !isSelected && "hover:bg-[#F9FAFB]",
                    )}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectCustomer(customer)}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-[#111827]">
                        {customerDisplayName(customer)}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-[#6B7280]">
                        {customer.gstNumber}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
