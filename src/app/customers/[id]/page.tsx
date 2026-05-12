import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  cellText,
  formatAmount,
  formatDateTime,
  formatOptionalDate,
} from "@/lib/customer-display";
import { getCompanyPrintTitle } from "@/lib/company-print";
import { CustomerDetailToolbar } from "./customer-detail-toolbar";

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

function AmountCell({ formatted }: { formatted: string }) {
  if (formatted === "—") {
    return <span className="text-zinc-400 tabular-nums">—</span>;
  }
  return (
    <span className="inline-block rounded-md bg-emerald-100/90 px-2.5 py-1 text-base font-semibold tabular-nums tracking-tight text-emerald-950 ring-1 ring-emerald-900/[0.08] print:bg-zinc-100 print:text-zinc-900 print:ring-zinc-300 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-400/15">
      {formatted}
    </span>
  );
}

function ExtentCell({ formatted }: { formatted: string }) {
  if (formatted === "—") {
    return <span className="text-zinc-400 tabular-nums print:text-zinc-500">—</span>;
  }
  return (
    <span className="font-medium tabular-nums text-zinc-900 print:text-black dark:text-zinc-100">
      {formatted}
    </span>
  );
}

function DataTable({
  rows,
}: {
  rows: {
    label: string;
    value: string;
    variant?: "money" | "extent" | "text";
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800 print:divide-zinc-300">
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-zinc-300">
          {rows.map((row) => (
            <tr
              key={row.label}
              className="bg-white transition-colors hover:bg-zinc-50/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/30 print:bg-white print:hover:bg-white"
            >
              <th
                scope="row"
                className="w-[min(42%,16rem)] max-w-[16rem] whitespace-normal py-3.5 pl-4 pr-3 text-left text-sm font-medium leading-snug text-zinc-600 sm:pl-5 dark:text-zinc-400 print:py-2 print:pl-0 print:pr-2 print:text-sm print:text-zinc-800"
              >
                {row.label}
              </th>
              <td className="py-3.5 pr-4 pl-2 text-left text-sm sm:pr-5 print:py-2 print:pr-0 print:text-sm">
                {row.variant === "money" ? (
                  <AmountCell formatted={row.value} />
                ) : row.variant === "extent" ? (
                  <ExtentCell formatted={row.value} />
                ) : (
                  <span className="text-zinc-900 print:text-black dark:text-zinc-100">
                    {row.value}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 first:mt-0 dark:text-zinc-400 print:mb-2 print:mt-5 print:text-[10pt] print:text-zinc-700 first:print:mt-0">
      {children}
    </h3>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print:break-inside-avoid rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/40 dark:ring-white/[0.05] print:mb-4 print:rounded-lg print:border-zinc-400 print:bg-white print:shadow-none print:ring-0">
      <header className="border-b border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800 print:border-zinc-300 print:px-4 print:py-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 print:text-[12pt] print:text-black">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 print:mt-0.5 print:text-[9.5pt] print:text-zinc-700">
            {subtitle}
          </p>
        ) : null}
      </header>
      <div className="p-5 sm:p-6 print:p-4">{children}</div>
    </section>
  );
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
  const deleteLabel = buildDeleteLabel(customer);
  const companyTitle = getCompanyPrintTitle();
  const printedAt = formatDateTime(new Date());

  return (
    <div className="min-h-0 flex-1 bg-zinc-50/80 pb-10 pt-6 dark:bg-zinc-950 print:bg-white print:pb-0 print:pt-0">
      <div className="customer-print-area mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <CustomerDetailToolbar customerId={customer.id} deleteLabel={deleteLabel} />

        <article className="customer-print-sheet mt-6 space-y-6 print:mt-0 print:space-y-4">
          <header className="mb-6 hidden border-b-2 border-zinc-900 pb-4 print:mb-5 print:block">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl print:text-[16pt]">
              {companyTitle}
            </h1>
            <p className="mt-1 text-sm font-medium text-zinc-600 print:text-[11pt] print:text-zinc-800">
              Customer profile
            </p>
            <p className="mt-2 text-xs text-zinc-500 print:text-[9pt] print:text-zinc-600">
              Printed {printedAt}
            </p>
          </header>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/40 dark:ring-white/[0.05] sm:p-6 print:mb-4 print:rounded-lg print:border-zinc-400 print:bg-white print:p-4 print:shadow-none print:ring-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 print:text-[9pt] print:text-zinc-600">
              Customer record
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50 print:text-[14pt] print:text-black">
              {displayName}
            </h1>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400 print:text-[10pt] print:text-zinc-700">
              <span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 print:text-zinc-800">
                  ID
                </span>{" "}
                #{customer.id}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600 print:text-zinc-400" aria-hidden>
                ·
              </span>
              <span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 print:text-zinc-800">
                  Created
                </span>{" "}
                {formatDateTime(customer.createdAt)}
              </span>
            </p>
          </div>

          <SectionCard
            title="Basic Details"
            subtitle="Identity, survey references, and land summary."
          >
            <DataTable
              rows={[
                { label: "Farmer name", value: displayName, variant: "text" },
                {
                  label: "Changed farmer name",
                  value: cellText(customer.changedFarmerName),
                  variant: "text",
                },
                { label: "Vendor code", value: cellText(customer.vendorCode), variant: "text" },
                { label: "Survey number", value: cellText(customer.surveyNo), variant: "text" },
                {
                  label: "New survey number",
                  value: cellText(customer.newSurveyNo),
                  variant: "text",
                },
                {
                  label: "Balance extent (acre)",
                  value: formatAmount(customer.balanceExtentAcre),
                  variant: "extent",
                },
                {
                  label: "Balance extent (gunta)",
                  value: formatAmount(customer.balanceExtentGunta),
                  variant: "extent",
                },
                {
                  label: "Total gunta",
                  value: formatAmount(customer.totalGunta),
                  variant: "extent",
                },
                {
                  label: "Total cents",
                  value: formatAmount(customer.totalCents),
                  variant: "extent",
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="RTC Details" subtitle="Record of rights (RTC) measurements.">
            <DataTable
              rows={[
                {
                  label: "RTC extent (acre)",
                  value: formatAmount(customer.rtcExtentAcre),
                  variant: "extent",
                },
                {
                  label: "RTC extent (gunta)",
                  value: formatAmount(customer.rtcExtentGunta),
                  variant: "extent",
                },
                {
                  label: "RTC A kharab",
                  value: formatAmount(customer.rtcAKharab),
                  variant: "extent",
                },
                {
                  label: "RTC B kharab",
                  value: formatAmount(customer.rtcBKharab),
                  variant: "extent",
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Lease Details" subtitle="Lease extent, amount, and deed charges.">
            <DataTable
              rows={[
                {
                  label: "Lease extent (acre)",
                  value: formatAmount(customer.leaseExtentAcre),
                  variant: "extent",
                },
                {
                  label: "Lease extent (gunta)",
                  value: formatAmount(customer.leaseExtentGunta),
                  variant: "extent",
                },
                {
                  label: "Lease amount",
                  value: formatAmount(customer.leaseAmount),
                  variant: "money",
                },
                {
                  label: "Lease deed stamp duty",
                  value: formatAmount(customer.leaseDeedStampDuty),
                  variant: "money",
                },
                {
                  label: "Lease deed registration charges",
                  value: formatAmount(customer.leaseDeedRegCharges),
                  variant: "money",
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Payment Details"
            subtitle="Rent, advances, shortage, and receipts."
          >
            <Subheading>Rent</Subheading>
            <DataTable
              rows={[
                {
                  label: "Rent per acre",
                  value: formatAmount(customer.rentPerAcre),
                  variant: "money",
                },
                {
                  label: "Balance rent amount",
                  value: formatAmount(customer.balanceRentAmount),
                  variant: "money",
                },
                {
                  label: "Rent amount",
                  value: formatAmount(customer.rentAmount),
                  variant: "money",
                },
                {
                  label: "TDS amount",
                  value: formatAmount(customer.tdsAmount),
                  variant: "money",
                },
              ]}
            />

            <Subheading>AES advance</Subheading>
            <DataTable
              rows={[
                {
                  label: "AES advance cheque amount",
                  value: formatAmount(customer.aesAdvanceChequeAmount),
                  variant: "money",
                },
                {
                  label: "AES advance date",
                  value: formatOptionalDate(customer.aesAdvanceDate),
                  variant: "text",
                },
                {
                  label: "AES advance cheque number",
                  value: cellText(customer.aesAdvanceChequeNo),
                  variant: "text",
                },
                {
                  label: "AES advance bank name",
                  value: cellText(customer.aesAdvanceBankName),
                  variant: "text",
                },
              ]}
            />

            <Subheading>Shortage</Subheading>
            <DataTable
              rows={[
                {
                  label: "Shortage cheque amount",
                  value: formatAmount(customer.shortageChequeAmount),
                  variant: "money",
                },
                {
                  label: "Shortage date",
                  value: formatOptionalDate(customer.shortageDate),
                  variant: "text",
                },
                {
                  label: "Shortage cheque number",
                  value: cellText(customer.shortageChequeNo),
                  variant: "text",
                },
                {
                  label: "Shortage bank name",
                  value: cellText(customer.shortageBankName),
                  variant: "text",
                },
              ]}
            />

            <Subheading>Received</Subheading>
            <DataTable
              rows={[
                {
                  label: "Received NEFT amount",
                  value: formatAmount(customer.receivedNeftAmount),
                  variant: "money",
                },
                {
                  label: "Received date",
                  value: formatOptionalDate(customer.receivedDate),
                  variant: "text",
                },
                {
                  label: "Balance receivable",
                  value: formatAmount(customer.balanceReceivable),
                  variant: "money",
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Charges"
            subtitle="ATL, PAO, statutory fees, debit note, and loan."
          >
            <Subheading>ATL</Subheading>
            <DataTable
              rows={[
                {
                  label: "ATL stamp duty",
                  value: formatAmount(customer.atlStampDuty),
                  variant: "money",
                },
                {
                  label: "ATL registration charges",
                  value: formatAmount(customer.atlRegCharges),
                  variant: "money",
                },
                {
                  label: "ATL total",
                  value: formatAmount(customer.atlTotal),
                  variant: "money",
                },
              ]}
            />

            <Subheading>PAO</Subheading>
            <DataTable
              rows={[
                {
                  label: "PAO stamp duty",
                  value: formatAmount(customer.paoStampDuty),
                  variant: "money",
                },
                {
                  label: "PAO registration charges",
                  value: formatAmount(customer.paoRegCharges),
                  variant: "money",
                },
                {
                  label: "PAO total",
                  value: formatAmount(customer.paoTotal),
                  variant: "money",
                },
              ]}
            />

            <Subheading>Other charges</Subheading>
            <DataTable
              rows={[
                {
                  label: "Land conversion",
                  value: formatAmount(customer.landConversion),
                  variant: "money",
                },
                {
                  label: "Podi fee",
                  value: formatAmount(customer.podiFee),
                  variant: "money",
                },
                {
                  label: "Crop compensation",
                  value: formatAmount(customer.cropCompensation),
                  variant: "money",
                },
              ]}
            />

            <Subheading>Debit note & loan</Subheading>
            <DataTable
              rows={[
                {
                  label: "Debit note number",
                  value: cellText(customer.debitNoteNo),
                  variant: "text",
                },
                {
                  label: "Debit note amount",
                  value: formatAmount(customer.debitNoteAmount),
                  variant: "money",
                },
                {
                  label: "Loan amount",
                  value: formatAmount(customer.loanAmount),
                  variant: "money",
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Notes" subtitle="Internal remarks and follow-ups.">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200 print:border-zinc-300 print:bg-zinc-50">
              {customer.notes?.trim() ? (
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500">No notes recorded.</p>
              )}
            </div>
          </SectionCard>
        </article>
      </div>
    </div>
  );
}
