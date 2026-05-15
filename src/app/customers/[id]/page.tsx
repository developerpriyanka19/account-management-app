import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cellText, formatDateTime } from "@/lib/customer-display";
import { getCompanyPrintTitle } from "@/lib/company-print";
import { CustomerAlignedRows } from "../customer-aligned-rows";
import { CustomerDetailToolbar } from "./customer-detail-toolbar";
import { CustomersContentCard, CustomersPageShell } from "../customers-page-shell";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return { title: "Customer" };

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { farmerName: true },
  });

  const name = customer?.farmerName?.trim() || `Customer #${id}`;
  return { title: name };
}

function buildDeleteLabel(customer: Customer): string {
  const n = customer.farmerName?.trim();
  return n && n.length > 0 ? n : `Customer #${customer.id}`;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) notFound();

  const displayName = cellText(customer.farmerName);
  const vendorCode = customer.vendorCode?.trim();
  const deleteLabel = buildDeleteLabel(customer);
  const companyTitle = getCompanyPrintTitle();
  const printedAt = formatDateTime(new Date());

  return (
    <CustomersPageShell
      title={displayName}
      subtitle={`Vendor code: ${vendorCode && vendorCode.length > 0 ? vendorCode : "—"} · Created ${formatDateTime(customer.createdAt)}`}
      backHref="/customers"
      backLabel="Back to customers"
      maxWidth="form"
      actions={<CustomerDetailToolbar customerId={customer.id} deleteLabel={deleteLabel} />}
    >
      <article className="customer-print-sheet print:mt-0">
        <header className="mb-6 hidden border-b-2 border-[#111827] pb-4 print:mb-5 print:block">
          <h1 className="text-xl font-bold tracking-tight text-[#111827] print:text-[16pt]">
            {companyTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#6B7280] print:text-[11pt]">
            Customer profile
          </p>
          <p className="mt-2 text-xs text-[#6B7280] print:text-[9pt]">Printed {printedAt}</p>
        </header>

        <CustomersContentCard>
          <CustomerAlignedRows mode="display" customer={customer} />
        </CustomersContentCard>
      </article>
    </CustomersPageShell>
  );
}
