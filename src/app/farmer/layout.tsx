import { AppModuleShell } from "@/components/app-module-shell";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppModuleShell>{children}</AppModuleShell>;
}
