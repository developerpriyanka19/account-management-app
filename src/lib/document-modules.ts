import type { LucideIcon } from "lucide-react";
import { FileText, FileWarning } from "lucide-react";

export type DocumentModuleItem = {
  label: string;
  href: string;
  pageTitle: string;
};

export type DocumentModuleGroup = {
  id: "invoice" | "debit-note";
  menuLabel: string;
  icon: LucideIcon;
  items: DocumentModuleItem[];
};

export const INVOICE_MODULE_ITEMS: DocumentModuleItem[] = [
  {
    label: "NA Charges",
    href: "/invoice/na-charges",
    pageTitle: "NA Charges Invoice",
  },
  {
    label: "ATL",
    href: "/invoice/atl",
    pageTitle: "ATL Invoice",
  },
  {
    label: "GPA",
    href: "/invoice/gpa",
    pageTitle: "GPA Invoice",
  },
];

export const DEBIT_NOTE_MODULE_ITEMS: DocumentModuleItem[] = [
  {
    label: "Execution of Survey and Boundaries",
    href: "/debit-note/execution-of-survey-and-boundaries",
    pageTitle: "Execution of Survey and Boundaries",
  },
  {
    label: "Land DD Execution",
    href: "/debit-note/land-dd-execution",
    pageTitle: "Land DD Execution",
  },
  {
    label: "NA",
    href: "/debit-note/na",
    pageTitle: "NA Debit Note",
  },
];

export const DOCUMENT_MODULE_GROUPS: DocumentModuleGroup[] = [
  {
    id: "invoice",
    menuLabel: "Invoice",
    icon: FileText,
    items: INVOICE_MODULE_ITEMS,
  },
  {
    id: "debit-note",
    menuLabel: "Debit Note",
    icon: FileWarning,
    items: DEBIT_NOTE_MODULE_ITEMS,
  },
];

export function findDocumentModuleItem(
  pathname: string,
): (DocumentModuleItem & { groupLabel: string }) | null {
  for (const group of DOCUMENT_MODULE_GROUPS) {
    const item = group.items.find((i) => i.href === pathname);
    if (item) {
      return { ...item, groupLabel: group.menuLabel };
    }
  }
  return null;
}
