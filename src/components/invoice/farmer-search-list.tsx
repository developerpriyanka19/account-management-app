"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { LocatableFarmer } from "@/lib/location-cascade";

function farmerHaystack(f: LocatableFarmer): string {
  return [f.label, f.surveyNo, f.newSurveyNo, f.vendorCode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

type Props = {
  farmers: LocatableFarmer[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSetSelectedIds?: (ids: number[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
};

export function FarmerSearchList({
  farmers,
  selectedIds,
  onToggle,
  onSetSelectedIds,
  disabled,
  emptyMessage = "No farmers found",
}: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return farmers;
    return farmers.filter((f) => farmerHaystack(f).includes(q));
  }, [farmers, debouncedQuery]);

  const allFarmerIds = useMemo(() => farmers.map((f) => f.id), [farmers]);
  const allSelected =
    allFarmerIds.length > 0 && allFarmerIds.every((id) => selectedIds.includes(id));
  const selectedCount = selectedIds.length;

  function toggleSelectAll() {
    if (!onSetSelectedIds || disabled) return;
    onSetSelectedIds(allSelected ? [] : allFarmerIds);
  }

  return (
    <div className="mt-3 flex flex-col">
      <div className="sticky top-0 z-10 -mx-1 bg-white px-1 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            type="search"
            disabled={disabled}
            placeholder="Search farmers by name or survey number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full pl-9"
            aria-label="Search farmers"
          />
        </div>
        {selectedCount > 0 ? (
          <p className="mt-2 text-xs font-medium text-[#2563EB]">
            Selected Farmers ({selectedCount})
          </p>
        ) : null}
      </div>

      <ul
        className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-[#E5E7EB] p-1.5 sm:max-h-64"
        role="listbox"
        aria-multiselectable
      >
        <li role="option" aria-selected={allSelected}>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2.5 py-2 font-medium transition-colors",
              allSelected && "border-[#BFDBFE] bg-[#EFF6FF]",
              !allSelected && "hover:border-[#E5E7EB] hover:bg-[#F9FAFB]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="checkbox"
              checked={allSelected}
              disabled={disabled || farmers.length === 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 shrink-0 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span className="text-sm text-[#111827]">Select All</span>
          </label>
        </li>

        {filtered.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-[#6B7280]">{emptyMessage}</li>
        ) : (
          filtered.map((f) => {
            const checked = selectedIds.includes(f.id);
            const surveyHint = f.surveyNo?.trim();
            return (
              <li key={f.id} role="option" aria-selected={checked}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors",
                    checked && "border-[#BFDBFE] bg-[#EFF6FF]",
                    !checked && "hover:border-[#E5E7EB] hover:bg-[#F9FAFB]",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(f.id)}
                    className="h-4 w-4 shrink-0 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#111827]">{f.label}</span>
                    <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-[#6B7280]">
                      {surveyHint ? <span>Survey: {surveyHint}</span> : null}
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
