import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cellText } from "@/lib/customer-display";
import { EditCustomerForm } from "./edit-customer-form";
import { CustomersContentCard, CustomersPageShell } from "../../customers-page-shell";

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
  const displayTitle = title === "—" ? `Customer #${customer.id}` : title;

  return (
    <CustomersPageShell
      title={`Edit: ${displayTitle}`}
      backHref={`/customers/${customer.id}`}
      backLabel="Back to customer"
      maxWidth="form"
    >
      <CustomersContentCard>
        <EditCustomerForm customer={customer} />
      </CustomersContentCard>
    </CustomersPageShell>
  );
}
