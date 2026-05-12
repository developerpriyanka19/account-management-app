import type { Metadata } from "next";
import Link from "next/link";
import { CustomerForm } from "./customer-form";

export const metadata: Metadata = {
  title: "Add Customer",
};

export default function NewCustomerPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/customers"
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to customers
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Add customer
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the details below. You will be returned to the customer list
          after a successful save.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <CustomerForm />
      </div>
    </div>
  );
}
