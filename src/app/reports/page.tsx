import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Landmark,
  List,
  UserRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Reports",
};

const REPORTS = [
  {
    href: "/reports/farmer-list",
    title: "Farmer List Report",
    description: "Filter by location and search farmers with export and print.",
    icon: List,
  },
  {
    href: "/reports/individual-farmer",
    title: "Individual Farmer Report",
    description: "View one farmer’s details, payments, fees, invoices, and debit notes.",
    icon: UserRound,
  },
  {
    href: "/reports/company-payment",
    title: "Company Payment Report",
    description: "Farmer-wise company payments for a selected period.",
    icon: Building2,
  },
  {
    href: "/reports/government-fee",
    title: "Government Fee Report",
    description: "Farmer-wise government fee totals for a selected period.",
    icon: Landmark,
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold text-[#111827]">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a report to filter, print, or export farmer and payment data.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">{report.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
