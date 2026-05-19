import Link from "next/link";
import { notFound } from "next/navigation";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import { gstCustomerDisplayName, toGstCustomerRow } from "@/lib/gst-customer";
import { Button } from "@/components/ui/button";
import { DeleteGstCustomerButton } from "@/components/customer/delete-gst-customer-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim();
  return (
    <div className="grid gap-1 border-b border-[#E5E7EB] py-3 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</dt>
      <dd className="text-sm text-[#111827]">{text && text.length > 0 ? text : "—"}</dd>
    </div>
  );
}

export default async function GstCustomerDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const record = await gstCustomerDb().findUnique({ where: { id } });
  if (!record) notFound();

  const customer = toGstCustomerRow(record);
  const name = gstCustomerDisplayName(customer);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[#D1D5DB] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/customers-management"
            className="text-xs font-medium text-[#2563EB] hover:underline"
          >
            ← Back to customers
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-[#111827]">{name}</h1>
          <p className="mt-1 font-mono text-sm text-[#6B7280]">{customer.gstNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/customers-management/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <DeleteGstCustomerButton customerId={id} label={name} />
        </div>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white px-4 shadow-sm">
        <h2 className="border-b border-[#E5E7EB] py-3 text-sm font-semibold text-[#111827]">
          GST Details
        </h2>
        <dl>
          <DetailRow label="Company Name" value={customer.companyName} />
          <DetailRow label="Company Address" value={customer.companyAddress} />
          <DetailRow label="State" value={customer.state} />
          <DetailRow label="GST Status" value={customer.gstStatus} />
          <DetailRow label="PAN Number" value={customer.panNumber} />
        </dl>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white px-4 shadow-sm">
        <h2 className="border-b border-[#E5E7EB] py-3 text-sm font-semibold text-[#111827]">
          Contact Details
        </h2>
        <dl>
          <DetailRow label="First Name" value={customer.firstName} />
          <DetailRow label="Last Name" value={customer.lastName} />
          <DetailRow label="Mobile" value={customer.mobile} />
          <DetailRow label="Email" value={customer.email} />
          <DetailRow label="Notes" value={customer.notes} />
        </dl>
      </section>
    </div>
  );
}
