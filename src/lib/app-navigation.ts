import type { LucideIcon } from "lucide-react";
import {
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

export const SIDEBAR_INVOICE_GROUP: SidebarNavGroup = {
  id: "invoice",
  label: "Invoice",
  icon: FileText,
  items: [
    { label: "NA Invoice", href: "/invoice/na" },
    { label: "Service Invoice", href: "/invoice/service" },
    { label: "Customers", href: "/customers-management" },
  ],
};

export const SIDEBAR_DEBIT_NOTE_GROUP: SidebarNavGroup = {
  id: "debit-note",
  label: "Debit Notes",
  icon: Receipt,
  items: [
    { label: "Add Debit Note", href: "/debit-note/execution-of-survey-and-boundaries" },
    { label: "Debit Note List", href: "/debit-note/land-dd-execution" },
    { label: "Export Debit Notes", href: "/debit-note/na" },
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
  if (href === "/customers-management") {
    return pathname === "/customers-management" || pathname.startsWith("/customers-management/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSidebarGroupActive(pathname: string, group: SidebarNavGroup): boolean {
  if (group.id === "invoice" && /^\/invoice\/\d+/.test(pathname)) {
    return true;
  }
  return group.items.some((item) => isSidebarPathActive(pathname, item.href));
}
