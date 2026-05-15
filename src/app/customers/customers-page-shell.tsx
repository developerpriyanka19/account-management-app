import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "list" | "form";
};

const maxWidthClass = {
  list: "max-w-[100rem]",
  form: "max-w-5xl",
};

export function CustomersPageShell({
  title,
  subtitle,
  backHref = "/customers",
  backLabel = "Back to customers",
  actions,
  children,
  maxWidth = "list",
}: Props) {
  return (
    <div
      className={`mx-auto flex w-full ${maxWidthClass[maxWidth]} flex-1 flex-col gap-4 bg-white px-4 py-6 text-[#111827] sm:px-6 lg:px-8`}
    >
      <header className="flex flex-col gap-3 border-b border-[#D1D5DB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="text-xs font-medium text-[#2563EB] hover:underline"
          >
            ← {backLabel}
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function CustomersContentCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm sm:p-5">
      {children}
    </div>
  );
}
