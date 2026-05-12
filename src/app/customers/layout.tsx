import Link from "next/link";
import { LogoutButton } from "./logout-button";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="customers-layout-shell flex min-h-full flex-1 flex-col">
      <div className="no-print border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/customers"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Customers
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
