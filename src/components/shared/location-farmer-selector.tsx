"use client";

import { useMemo } from "react";
import { FarmerSearchList } from "@/components/invoice/farmer-search-list";
import { Label } from "@/components/ui/label";
import {
  applyLocationFieldChange,
  buildCascadingLocationOptions,
  filterFarmersByLocation,
  isLocationComplete,
  pruneSelectedFarmerIds,
  type DocumentLocation,
  type LocatableFarmer,
  type LocationField,
} from "@/lib/location-cascade";

const selectClassName =
  "mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  farmers: LocatableFarmer[];
  location: DocumentLocation;
  onLocationChange: (next: DocumentLocation) => void;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSetSelectedIds: (ids: number[]) => void;
  disabled?: boolean;
  errors?: Partial<Record<LocationField, string>>;
  farmerError?: string;
  /** Hide farmer list until full location path is selected (default true). */
  requireCompleteLocation?: boolean;
};

/**
 * Shared cascading location dropdowns + farmer multi-select.
 * Location options come only from farmer master records.
 */
export function LocationFarmerSelector({
  farmers,
  location,
  onLocationChange,
  selectedIds,
  onToggle,
  onSetSelectedIds,
  disabled,
  errors,
  farmerError,
  requireCompleteLocation = true,
}: Props) {
  const options = useMemo(
    () => buildCascadingLocationOptions(farmers, location),
    [farmers, location],
  );

  const locationReady = isLocationComplete(location);
  const filteredFarmers = useMemo(() => {
    if (requireCompleteLocation && !locationReady) return [];
    return filterFarmersByLocation(farmers, location, selectedIds);
  }, [farmers, location, selectedIds, requireCompleteLocation, locationReady]);

  function handleFieldChange(field: LocationField, value: string) {
    const next = applyLocationFieldChange(location, field, value);
    onLocationChange(next);
    const kept = pruneSelectedFarmerIds(farmers, next, selectedIds);
    if (kept.length !== selectedIds.length) {
      onSetSelectedIds(kept);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label>State</Label>
          <select
            className={selectClassName}
            value={location.state}
            disabled={disabled}
            onChange={(e) => handleFieldChange("state", e.target.value)}
          >
            <option value="">Select state</option>
            {options.states.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.state ? (
            <p className="mt-1 text-xs text-red-600">{errors.state}</p>
          ) : null}
        </div>
        <div>
          <Label>District</Label>
          <select
            className={selectClassName}
            value={location.district}
            disabled={disabled || !location.state}
            onChange={(e) => handleFieldChange("district", e.target.value)}
          >
            <option value="">Select district</option>
            {options.districts.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.district ? (
            <p className="mt-1 text-xs text-red-600">{errors.district}</p>
          ) : null}
        </div>
        <div>
          <Label>Taluk</Label>
          <select
            className={selectClassName}
            value={location.taluk}
            disabled={disabled || !location.district}
            onChange={(e) => handleFieldChange("taluk", e.target.value)}
          >
            <option value="">Select taluk</option>
            {options.taluks.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.taluk ? (
            <p className="mt-1 text-xs text-red-600">{errors.taluk}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Hobli</Label>
          <select
            className={selectClassName}
            value={location.hobbli}
            disabled={disabled || !location.taluk}
            onChange={(e) => handleFieldChange("hobbli", e.target.value)}
          >
            <option value="">Select hobli</option>
            {options.hobblis.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.hobbli ? (
            <p className="mt-1 text-xs text-red-600">{errors.hobbli}</p>
          ) : null}
        </div>
        <div>
          <Label>Village</Label>
          <select
            className={selectClassName}
            value={location.village}
            disabled={disabled || !location.hobbli}
            onChange={(e) => handleFieldChange("village", e.target.value)}
          >
            <option value="">Select village</option>
            {options.villages.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.village ? (
            <p className="mt-1 text-xs text-red-600">{errors.village}</p>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#111827]">Farmers</h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Select location filters above, then search by farmer name or survey number.
        </p>
        {!locationReady && requireCompleteLocation ? (
          <p className="mt-3 rounded-md border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-3 py-6 text-center text-sm text-[#6B7280]">
            Select State, District, Taluk, Hobli, and Village to list matching farmers.
          </p>
        ) : (
          <FarmerSearchList
            farmers={filteredFarmers}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onSetSelectedIds={onSetSelectedIds}
            disabled={disabled}
            emptyMessage="No farmers found for the selected State, District, Taluk, Hobli, and Village."
          />
        )}
        {farmerError ? (
          <p className="mt-2 text-xs text-red-600">{farmerError}</p>
        ) : null}
      </div>
    </div>
  );
}
