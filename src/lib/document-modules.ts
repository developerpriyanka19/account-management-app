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
    label: "NA Invoices",
    href: "/invoice/na",
    pageTitle: "NA Invoices",
  },
  {
    label: "Service Invoices",
    href: "/invoice/service",
    pageTitle: "Service Invoices",
  },
];

export const DEBIT_NOTE_MODULE_ITEMS: DocumentModuleItem[] = [
  {
    label: "Land Conversion",
    href: "/debit-note/land-conversion",
    pageTitle: "Land Conversion Debit Note",
  },
  {
    label: "ATL and POA/GPA",
    href: "/debit-note/atl-poa-gpa",
    pageTitle: "ATL and POA/GPA Debit Note",
  },
  {
    label: "All Debit Notes",
    href: "/debit-note/all",
    pageTitle: "All Debit Notes",
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
