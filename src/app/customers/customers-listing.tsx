"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import type { CustomerListRow } from "@/lib/customer-list-format";
import { exportCustomersToExcel } from "@/lib/customer-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCustomersForExport } from "./actions";
import { CustomersTable } from "./customers-table";
import { CustomersToolbarMenus } from "./customers-toolbar-menus";

type Props = {
  customers: CustomerListRow[];
  totalFiltered: number;
  totalAll: number;
  query: string;
  page: number;
  totalPages: number;
  start: number;
  end: number;
  pageSize: number;
};

function customersListHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q.length > 0) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/customers?${s}` : "/customers";
}

function filterByName(rows: CustomerListRow[], nameSearch: string): CustomerListRow[] {
  const q = nameSearch.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((c) => {
    const name = c.farmerName?.trim().toLowerCase() ?? "";
    return name.includes(q);
  });
}

export function CustomersListing({
  customers,
  totalFiltered,
  totalAll,
  query,
  page,
  totalPages,
  start,
  end,
  pageSize,
}: Props) {
  const router = useRouter();
  const [nameSearch, setNameSearch] = useState(query);
  const [exportPending, startExport] = useTransition();

  useEffect(() => {
    setNameSearch(query);
  }, [query]);

  const pageRowsForExport = useMemo(
    () => filterByName(customers, nameSearch),
    [customers, nameSearch],
  );

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(customersListHref(nameSearch.trim(), 1));
  }

  function exportThisPage() {
    exportCustomersToExcel(
      pageRowsForExport,
      `customers-page-${page}${query ? `-search` : ""}.xlsx`,
    );
  }

  function exportAllMatching() {
    startExport(async () => {
      const rows = await fetchCustomersForExport(query);
      const filename = query
        ? `customers-all-matching-${query.slice(0, 40)}.xlsx`
        : "customers-all.xlsx";
      exportCustomersToExcel(rows, filename);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportPending || pageRowsForExport.length === 0}
              onClick={exportThisPage}
            >
              <Download className="h-3.5 w-3.5" />
              Export this page
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportPending || totalFiltered === 0}
              onClick={exportAllMatching}
            >
              <Download className="h-3.5 w-3.5" />
              {exportPending
                ? "Exporting…"
                : query
                  ? "Export all matching"
                  : "Export all customers"}
            </Button>
            <Link href="/customers/new">
              <Button type="button" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Add customer
              </Button>
            </Link>
            <CustomersToolbarMenus />
          </div>

          <form
            onSubmit={runSearch}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-md lg:justify-end"
          >
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
              <Input
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Search customer name..."
                className="h-8 border-[#D1D5DB] pl-8"
                aria-label="Search by customer name"
              />
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D1D5DB] pt-2 text-xs text-[#6B7280]">
          <p>
            <span className="font-semibold tabular-nums text-[#111827]">{totalFiltered}</span>{" "}
            {totalFiltered === 1 ? "customer" : "customers"}
            {query ? " matching search" : ""} ·{" "}
            <span className="tabular-nums">{totalAll}</span> total
          </p>
          <p>
            Showing <span className="font-medium tabular-nums text-[#111827]">{start}–{end}</span>{" "}
            of <span className="font-medium tabular-nums text-[#111827]">{totalFiltered}</span> ·{" "}
            <span className="tabular-nums">{pageSize}</span> per page
          </p>
        </div>
      </div>

      <CustomersTable customers={customers} nameFilter={nameSearch} />

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
              <Link href={customersListHref(query, page - 1)}>
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
              <Link href={customersListHref(query, page + 1)}>
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
