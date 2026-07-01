import { AppModuleShell } from "@/components/app-module-shell";

export const dynamic = "force-dynamic";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppModuleShell>{children}</AppModuleShell>;
}
