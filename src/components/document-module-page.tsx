import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DocumentBreadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  breadcrumbs: DocumentBreadcrumb[];
  children?: ReactNode;
};

export function DocumentModulePage({ title, breadcrumbs, children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col bg-white px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <header className="border-b border-[#D1D5DB] pb-4">
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B7280]">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 ? (
                    <span className="text-[#9CA3AF]" aria-hidden>
                      /
                    </span>
                  ) : null}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="font-medium text-[#2563EB] transition hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        isLast ? "font-medium text-[#111827]" : "text-[#6B7280]",
                      )}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-16 sm:py-24">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
          {title}
        </h1>
        {children ? (
          <div className="mt-6 w-full max-w-2xl text-center text-sm text-[#6B7280]">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
