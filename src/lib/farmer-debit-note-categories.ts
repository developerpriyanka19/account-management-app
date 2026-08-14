/** Configurable farmer debit note categories (add entries here to extend UI). */
export const FARMER_DEBIT_NOTE_CATEGORIES = [
  { id: "ATL_GPA", label: "ATL & GPA" },
  { id: "LAND_CONVERSION", label: "Land Conversion" },
  { id: "OTHER_RECOVERIES", label: "Other Recoveries" },
] as const;

export type FarmerDebitNoteCategoryId = (typeof FARMER_DEBIT_NOTE_CATEGORIES)[number]["id"];

export function farmerDebitNoteCategoryLabel(categoryId: string): string {
  const found = FARMER_DEBIT_NOTE_CATEGORIES.find((c) => c.id === categoryId);
  return found?.label ?? categoryId.replace(/_/g, " ");
}

export function isKnownFarmerDebitNoteCategory(categoryId: string): boolean {
  return FARMER_DEBIT_NOTE_CATEGORIES.some((c) => c.id === categoryId);
}
