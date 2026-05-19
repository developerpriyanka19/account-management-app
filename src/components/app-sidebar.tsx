"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/app/farmer/logout-button";
import {
  SIDEBAR_DASHBOARD,
  SIDEBAR_NAV_GROUPS,
  SIDEBAR_SIGN_OUT,
  isSidebarGroupActive,
  isSidebarPathActive,
  type SidebarNavGroup,
} from "@/lib/app-navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function NavLink({
  href,
  label,
  active,
  nested,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-md text-sm transition-colors",
        nested ? "px-3 py-2 pl-9" : "px-3 py-2.5",
        active
          ? "bg-[#EFF6FF] font-medium text-[#1D4ED8]"
          : "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]",
      )}
    >
      {label}
    </Link>
  );
}

function SidebarNavGroupItem({
  group,
  pathname,
  defaultOpen,
  onNavigate,
}: {
  group: SidebarNavGroup;
  pathname: string;
  defaultOpen: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = group.icon;
  const groupActive = isSidebarGroupActive(pathname, group);

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
          groupActive
            ? "bg-[#EFF6FF] text-[#1D4ED8]"
            : "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]",
        )}
        aria-expanded={open}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-0.5 space-y-0.5 pb-1">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isSidebarPathActive(pathname, item.href)}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarPanel({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const DashboardIcon = SIDEBAR_DASHBOARD.icon;
  const SignOutIcon = SIDEBAR_SIGN_OUT.icon;
  const dashboardActive = isSidebarPathActive(pathname, SIDEBAR_DASHBOARD.href);

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white",
        className,
      )}
    >
      <div className="border-b border-[#E5E7EB] px-4 py-4">
        <Link
          href="/farmer"
          onClick={onNavigate}
          className="text-sm font-semibold tracking-tight text-[#111827]"
        >
          Account Management
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <Link
          href={SIDEBAR_DASHBOARD.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            dashboardActive
              ? "bg-[#EFF6FF] text-[#1D4ED8]"
              : "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]",
          )}
        >
          <DashboardIcon className="h-4 w-4 shrink-0" aria-hidden />
          {SIDEBAR_DASHBOARD.label}
        </Link>

        {SIDEBAR_NAV_GROUPS.map((group) => (
          <SidebarNavGroupItem
            key={group.id}
            group={group}
            pathname={pathname}
            defaultOpen={isSidebarGroupActive(pathname, group)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-[#E5E7EB] p-3">
        <LogoutButton
          variant="sidebar"
          label={SIDEBAR_SIGN_OUT.label}
          icon={<SignOutIcon className="h-4 w-4 shrink-0" aria-hidden />}
        />
      </div>
    </aside>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-[#111827]">Account Management</span>
      </div>

      <div className="hidden shrink-0 lg:block">
        <SidebarPanel pathname={pathname} className="fixed inset-y-0 left-0 z-30" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <SidebarPanel
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              className="h-full"
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
