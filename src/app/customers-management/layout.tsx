import { AppModuleShell } from "@/components/app-module-shell";
import { ToastProvider } from "@/components/customer/toast";

export const dynamic = "force-dynamic";

export default function CustomersManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppModuleShell>
      <ToastProvider>{children}</ToastProvider>
    </AppModuleShell>
  );
}
