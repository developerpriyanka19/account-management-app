"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DATE_DISPLAY_PLACEHOLDER,
  toDisplayDate,
  toStorageDate,
} from "@/lib/date-format";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  name?: string;
  /** Stored value as YYYY-MM-DD (or empty). */
  value?: string;
  defaultValue?: string;
  onChange?: (storageIso: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Optional: disallow dates after this YYYY-MM-DD. */
  maxStorageDate?: string;
  /** When true, show a clear (X) control for optional fields. */
  clearable?: boolean;
  className?: string;
  "aria-label"?: string;
};

function parseStorageToDate(iso: string | undefined | null): Date | undefined {
  const storage = toStorageDate(iso ?? "") ?? (iso?.trim() || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(storage)) return undefined;
  const [y, m, d] = storage.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m! - 1 ||
    date.getDate() !== d
  ) {
    return undefined;
  }
  return date;
}

function dateToStorage(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Shared date picker — calendar select, displays DD/MM/YYYY, stores YYYY-MM-DD.
 * Kept as `DateInput` export name for existing call sites.
 */
export function DateInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  maxStorageDate,
  clearable = false,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const storageValue = controlled ? (value ?? "") : uncontrolled;
  const selected = useMemo(() => parseStorageToDate(storageValue), [storageValue]);
  const display = toDisplayDate(storageValue) || "";

  const maxDate = useMemo(() => {
    if (!maxStorageDate?.trim()) return undefined;
    return parseStorageToDate(maxStorageDate);
  }, [maxStorageDate]);

  function commit(nextIso: string) {
    if (!controlled) setUncontrolled(nextIso);
    onChange?.(nextIso);
  }

  function handleSelect(date: Date | undefined) {
    if (!date) {
      commit("");
      return;
    }
    const iso = dateToStorage(date);
    if (maxStorageDate && iso > maxStorageDate) return;
    commit(iso);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    commit("");
  }

  return (
    <div className={cn("min-w-0", className)}>
      {name ? <input type="hidden" name={name} value={storageValue} required={required} /> : null}
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel ?? DATE_DISPLAY_PLACEHOLDER}
            aria-required={required || undefined}
            className={cn(
              "h-9 w-full justify-start gap-2 px-3 text-left text-sm font-normal",
              !display && "text-[#9CA3AF]",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-[#6B7280]" />
            <span className="flex-1 truncate">{display || DATE_DISPLAY_PLACEHOLDER}</span>
            {clearable && display && !disabled ? (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                className="rounded p-0.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111827]"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    commit("");
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={maxDate ? { after: maxDate } : undefined}
            defaultMonth={selected ?? new Date()}
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={maxDate ?? new Date(new Date().getFullYear() + 5, 11)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Alias for clarity at new call sites. */
export { DateInput as DatePicker };
