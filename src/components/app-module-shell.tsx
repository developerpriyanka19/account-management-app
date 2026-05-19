import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";

export function AppModuleShell({ children }: { children: ReactNode }) {
  return (
    <div className="customers-layout-shell flex min-h-full flex-1 bg-white text-[#111827] [color-scheme:light]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[240px]">{children}</div>
    </div>
  );
}
