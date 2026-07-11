/** Cascading location helpers — farmer master data is the source of truth. */

export type DocumentLocation = {
  state: string;
  district: string;
  taluk: string;
  hobbli: string;
  village: string;
};

export type LocatableFarmer = {
  id: number;
  label: string;
  surveyNo?: string | null;
  newSurveyNo?: string | null;
  vendorCode?: string | null;
  state?: string | null;
  district?: string | null;
  taluk?: string | null;
  hobbli?: string | null;
  village?: string | null;
};

export type LocationField = keyof DocumentLocation;

export const EMPTY_DOCUMENT_LOCATION: DocumentLocation = {
  state: "",
  district: "",
  taluk: "",
  hobbli: "",
  village: "",
};

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function farmerMatchesLocation(
  farmer: Pick<
    LocatableFarmer,
    "state" | "district" | "taluk" | "hobbli" | "village"
  >,
  location: DocumentLocation,
): boolean {
  if (location.state && (farmer.state?.trim() ?? "") !== location.state) return false;
  if (location.district && (farmer.district?.trim() ?? "") !== location.district) {
    return false;
  }
  if (location.taluk && (farmer.taluk?.trim() ?? "") !== location.taluk) return false;
  if (location.hobbli && (farmer.hobbli?.trim() ?? "") !== location.hobbli) return false;
  if (location.village && (farmer.village?.trim() ?? "") !== location.village) {
    return false;
  }
  return true;
}

export function isLocationComplete(location: DocumentLocation): boolean {
  return Boolean(
    location.state.trim() &&
      location.district.trim() &&
      location.taluk.trim() &&
      location.hobbli.trim() &&
      location.village.trim(),
  );
}

/** Apply a field change and clear dependent child fields. */
export function applyLocationFieldChange(
  prev: DocumentLocation,
  field: LocationField,
  value: string,
): DocumentLocation {
  const next = { ...prev, [field]: value };
  if (field === "state") {
    next.district = "";
    next.taluk = "";
    next.hobbli = "";
    next.village = "";
  } else if (field === "district") {
    next.taluk = "";
    next.hobbli = "";
    next.village = "";
  } else if (field === "taluk") {
    next.hobbli = "";
    next.village = "";
  } else if (field === "hobbli") {
    next.village = "";
  }
  return next;
}

export function buildCascadingLocationOptions(
  farmers: LocatableFarmer[],
  location: DocumentLocation,
): {
  states: string[];
  districts: string[];
  taluks: string[];
  hobblis: string[];
  villages: string[];
} {
  const withCurrent = (opts: string[], current: string) =>
    current && !opts.includes(current) ? uniqueSorted([...opts, current]) : opts;

  const states = withCurrent(
    uniqueSorted(farmers.map((f) => f.state)),
    location.state.trim(),
  );

  const districts = withCurrent(
    uniqueSorted(
      farmers
        .filter((f) => !location.state || (f.state?.trim() ?? "") === location.state)
        .map((f) => f.district),
    ),
    location.district.trim(),
  );

  const taluks = withCurrent(
    uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!location.state || (f.state?.trim() ?? "") === location.state) &&
            (!location.district || (f.district?.trim() ?? "") === location.district),
        )
        .map((f) => f.taluk),
    ),
    location.taluk.trim(),
  );

  const hobblis = withCurrent(
    uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!location.state || (f.state?.trim() ?? "") === location.state) &&
            (!location.district || (f.district?.trim() ?? "") === location.district) &&
            (!location.taluk || (f.taluk?.trim() ?? "") === location.taluk),
        )
        .map((f) => f.hobbli),
    ),
    location.hobbli.trim(),
  );

  const villages = withCurrent(
    uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!location.state || (f.state?.trim() ?? "") === location.state) &&
            (!location.district || (f.district?.trim() ?? "") === location.district) &&
            (!location.taluk || (f.taluk?.trim() ?? "") === location.taluk) &&
            (!location.hobbli || (f.hobbli?.trim() ?? "") === location.hobbli),
        )
        .map((f) => f.village),
    ),
    location.village.trim(),
  );

  return { states, districts, taluks, hobblis, villages };
}

/** Farmers matching location; optionally keep already-selected farmers visible. */
export function filterFarmersByLocation(
  farmers: LocatableFarmer[],
  location: DocumentLocation,
  selectedIds: number[] = [],
): LocatableFarmer[] {
  if (!isLocationComplete(location)) return [];
  const matched = farmers.filter((f) => farmerMatchesLocation(f, location));
  const selectedExtra = farmers.filter(
    (f) => selectedIds.includes(f.id) && !matched.some((m) => m.id === f.id),
  );
  return [...matched, ...selectedExtra];
}

export function pruneSelectedFarmerIds(
  farmers: LocatableFarmer[],
  location: DocumentLocation,
  selectedIds: number[],
): number[] {
  return selectedIds.filter((id) => {
    const farmer = farmers.find((f) => f.id === id);
    return farmer ? farmerMatchesLocation(farmer, location) : false;
  });
}

export function validateDocumentLocation(
  location: DocumentLocation,
): Partial<Record<LocationField, string>> {
  const errors: Partial<Record<LocationField, string>> = {};
  if (!location.state.trim()) errors.state = "State is required";
  if (!location.district.trim()) errors.district = "District is required";
  if (!location.taluk.trim()) errors.taluk = "Taluk is required";
  if (!location.hobbli.trim()) errors.hobbli = "Hobli is required";
  if (!location.village.trim()) errors.village = "Village is required";
  return errors;
}
