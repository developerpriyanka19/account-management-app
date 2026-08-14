"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Search } from "lucide-react";
import type { GstCustomerRow } from "@/lib/gst-customer";
import { fetchGstCustomersForExport } from "@/app/customers-management/actions";
import { CustomerModal } from "@/components/customer/customer-modal";
import { CustomerTable } from "@/components/customer/customer-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  customers: GstCustomerRow[];
  totalFiltered: number;
  query: string;
  page: number;
  totalPages: number;
  start: number;
  end: number;
};

function listHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q.length > 0) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/customers-management?${s}` : "/customers-management";
}

function exportCsv(rows: GstCustomerRow[], filename: string) {
  const headers = [
    "First Name",
    "Last Name",
    "GST Number",
    "Company Name",
    "Building",
    "Street",
    "Locality",
    "Village",
    "District",
    "State",
    "PIN Code",
    "GST Status",
    "PAN",
    "Mobile",
    "Email",
    "Notes",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.firstName,
        r.lastName,
        r.gstNumber,
        r.companyName ?? "",
        r.buildingNumber ?? "",
        r.street ?? "",
        r.locality ?? "",
        r.village ?? "",
        r.district ?? "",
        r.state ?? "",
        r.pincode ?? "",
        r.gstStatus ?? "",
        r.panNumber ?? "",
        r.mobile ?? "",
        r.email ?? "",
        r.notes ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CustomersManagementListing({
  customers,
  totalFiltered,
  query,
  page,
  totalPages,
  start,
  end,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [exportPending, startExport] = useTransition();

  useEffect(() => {
    setSearch(query);
  }, [query]);

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(listHref(search.trim(), 1));
  }

  function exportAll() {
    startExport(async () => {
      const rows = await fetchGstCustomersForExport(query);
      const filename = query
        ? `customers-matching-${query.slice(0, 30)}.csv`
        : "customers-all.csv";
      exportCsv(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt,
        })),
        filename,
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CustomerModal />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportPending || totalFiltered === 0}
              onClick={exportAll}
            >
              <Download className="h-3.5 w-3.5" />
              {exportPending ? "Exporting…" : "Export"}
            </Button>
          </div>

          <form
            onSubmit={runSearch}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-md lg:justify-end"
          >
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, GST, company…"
                className="h-8 border-[#D1D5DB] pl-8"
                aria-label="Search customers"
              />
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>

        <p className="border-t border-[#D1D5DB] pt-2 text-xs text-[#6B7280]">
          <span className="font-semibold tabular-nums text-[#111827]">{totalFiltered}</span>{" "}
          {totalFiltered === 1 ? "customer" : "customers"}
          {query ? " matching search" : ""} · Showing{" "}
          <span className="font-medium tabular-nums text-[#111827]">{start}–{end}</span>
        </p>
      </div>

      <CustomerTable customers={customers} />

      {totalPages > 1 ? (
        <nav
          className="flex flex-col gap-2 rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Pagination"
        >
          <p className="text-xs text-[#6B7280]">
            Page <span className="font-semibold text-[#111827]">{page}</span> of{" "}
            <span className="font-semibold text-[#111827]">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={listHref(query, page - 1)}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link href={listHref(query, page + 1)}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
