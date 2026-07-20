import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
} from "lucide-react";

export type SidebarNavLink = {
  label: string;
  href: string;
};

export type SidebarNavGroup = {
  id: "invoice" | "debit-note";
  label: string;
  icon: LucideIcon;
  items: SidebarNavLink[];
};

export const SIDEBAR_DASHBOARD = {
  label: "Dashboard",
  href: "/farmer",
  icon: LayoutDashboard,
} as const;

export const SIDEBAR_REPORTS = {
  label: "Reports",
  href: "/reports",
  icon: BarChart3,
} as const;

export const SIDEBAR_INVOICE_GROUP: SidebarNavGroup = {
  id: "invoice",
  label: "Invoice",
  icon: FileText,
  items: [
    { label: "NA Invoices", href: "/invoice/na" },
    { label: "Service Invoices", href: "/invoice/service" },
    { label: "Quotation", href: "/invoice/quotation" },
    { label: "Customers", href: "/customers-management" },
    { label: "Bank Details", href: "/invoice/bank-details" },
  ],
};

export const SIDEBAR_DEBIT_NOTE_GROUP: SidebarNavGroup = {
  id: "debit-note",
  label: "Debit Notes",
  icon: Receipt,
  items: [
    { label: "Land Conversion", href: "/debit-note/land-conversion" },
    { label: "ATL and POA/GPA", href: "/debit-note/atl-poa-gpa" },
    { label: "Lease Deed Execution", href: "/debit-note/lease-deed-execution" },
    { label: "Service Order", href: "/debit-note/service-order" },
  ],
};

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  SIDEBAR_INVOICE_GROUP,
  SIDEBAR_DEBIT_NOTE_GROUP,
];

export const SIDEBAR_SIGN_OUT = {
  label: "Sign Out",
  icon: LogOut,
} as const;

export function isSidebarPathActive(pathname: string, href: string): boolean {
  if (href === "/farmer") {
    return pathname === "/farmer" || pathname.startsWith("/farmer/");
  }
  if (href === "/reports") {
    return pathname === "/reports" || pathname.startsWith("/reports/");
  }
  if (href === "/customers-management") {
    return pathname === "/customers-management" || pathname.startsWith("/customers-management/");
  }
  if (href === "/invoice/bank-details") {
    return pathname === "/invoice/bank-details" || pathname.startsWith("/invoice/bank-details/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSidebarGroupActive(pathname: string, group: SidebarNavGroup): boolean {
  if (group.id === "invoice" && /^\/invoice\/\d+/.test(pathname)) {
    return true;
  }
  if (group.id === "invoice" && pathname.startsWith("/invoice/bank-details")) {
    return true;
  }
  if (group.id === "invoice" && pathname.startsWith("/invoice/quotation")) {
    return true;
  }
  if (
    group.id === "debit-note" &&
    (/^\/debit-note\/\d+/.test(pathname) || /^\/debit-note\/view\/\d+$/.test(pathname))
  ) {
    return true;
  }
  return group.items.some((item) => isSidebarPathActive(pathname, item.href));
}
