import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cellText } from "@/lib/customer-display";
import { EditCustomerForm } from "./edit-customer-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: raw } = await params;
  return { title: `Edit customer #${raw}` };
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) notFound();

  const title = cellText(customer.farmerName);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/customers/${customer.id}`}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to customer
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Edit customer
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {title === "—" ? `Customer #${customer.id}` : title}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <EditCustomerForm customer={customer} />
      </div>
    </div>
  );
}
