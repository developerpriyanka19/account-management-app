"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { exportCustomersToExcel } from "@/lib/customer-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAllFarmersForExport } from "@/app/farmer/actions";
import { FarmerTable } from "@/components/farmer/farmer-table";
import type { CustomerListRow } from "@/lib/customer-list-format";

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
  return s ? `/farmer?${s}` : "/farmer";
}

export function FarmerListing({
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

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(customersListHref(nameSearch.trim(), 1));
  }

  function exportAllFarmers() {
    startExport(async () => {
      const rows = await fetchAllFarmersForExport();
      const stamp = new Date().toISOString().slice(0, 10);
      exportCustomersToExcel(rows, `farmers-all-${stamp}.xlsx`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={runSearch}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-xl"
          >
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Search farmer name..."
                className="h-[42px] rounded-full border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-[#2563EB]/30"
                aria-label="Search by farmer name"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-[42px] rounded-full border-slate-200 px-4 shadow-sm"
              onClick={() => runSearch()}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exportPending || totalAll === 0}
              onClick={exportAllFarmers}
              className="h-[42px] rounded-full border-slate-200 px-5 shadow-sm"
            >
              <Download className="h-4 w-4" />
              {exportPending ? "Exporting…" : "Export"}
            </Button>
            <Link href="/farmer/new">
              <Button
                type="button"
                className="h-[42px] rounded-full bg-[#2563EB] px-5 shadow-sm hover:bg-[#1D4ED8]"
              >
                <Plus className="h-4 w-4" />
                Add Farmer
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            <span className="font-semibold tabular-nums text-slate-700">{totalFiltered}</span>{" "}
            {totalFiltered === 1 ? "farmer" : "farmers"}
            {query ? " matching search" : ""} ·{" "}
            <span className="tabular-nums">{totalAll}</span> total
          </p>
          <p>
            Showing <span className="font-medium tabular-nums text-slate-700">{start}–{end}</span>{" "}
            of <span className="font-medium tabular-nums text-slate-700">{totalFiltered}</span> ·{" "}
            <span className="tabular-nums">{pageSize}</span> per page
          </p>
        </div>
      </div>

      <FarmerTable customers={customers} nameFilter={nameSearch} />

      {totalPages > 1 ? (
        <nav
          className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          aria-label="Pagination"
        >
          <p className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={customersListHref(query, page - 1)}>
                <Button variant="outline" size="sm" className="rounded-full">
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled className="rounded-full">
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link href={customersListHref(query, page + 1)}>
                <Button variant="outline" size="sm" className="rounded-full">
                  Next
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled className="rounded-full">
                Next
              </Button>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
