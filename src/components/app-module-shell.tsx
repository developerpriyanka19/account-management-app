import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/app/customers/logout-button";

export function AppModuleShell({ children }: { children: ReactNode }) {
  return (
    <div className="customers-layout-shell flex min-h-full flex-1 flex-col bg-white text-[#111827] [color-scheme:light]">
      <div className="no-print border-b border-[#D1D5DB] bg-white">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/customers" className="text-sm font-semibold text-[#111827]">
            Account Management
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
