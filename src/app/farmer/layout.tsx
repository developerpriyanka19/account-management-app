import { AppModuleShell } from "@/components/app-module-shell";

/** DB-backed routes — do not prerender at build (DATABASE_URL is runtime-only on Vercel). */
export const dynamic = "force-dynamic";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppModuleShell>{children}</AppModuleShell>;
}
