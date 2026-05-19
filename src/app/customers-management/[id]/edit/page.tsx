import Link from "next/link";
import { notFound } from "next/navigation";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import { gstCustomerDisplayName, toGstCustomerRow } from "@/lib/gst-customer";
import { EditGstCustomerForm } from "./edit-gst-customer-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGstCustomerPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const record = await gstCustomerDb().findUnique({ where: { id } });
  if (!record) notFound();

  const customer = toGstCustomerRow(record);
  const name = gstCustomerDisplayName(customer);

  const initialValues = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    gstNumber: customer.gstNumber,
    companyName: customer.companyName ?? "",
    companyAddress: customer.companyAddress ?? "",
    state: customer.state ?? "",
    gstStatus: customer.gstStatus ?? "",
    panNumber: customer.panNumber ?? "",
    mobile: customer.mobile ?? "",
    email: customer.email ?? "",
    notes: customer.notes ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-[#D1D5DB] pb-4">
        <Link
          href={`/customers-management/${id}`}
          className="text-xs font-medium text-[#2563EB] hover:underline"
        >
          ← Back to customer
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#111827]">Edit {name}</h1>
      </header>

      <div className="rounded-lg border border-[#D1D5DB] bg-white p-6 shadow-sm">
        <EditGstCustomerForm customerId={id} initialValues={initialValues} />
      </div>
    </div>
  );
}
