"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import { exportCustomersToExcel } from "@/lib/customer-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAllFarmersForExport } from "@/app/farmer/actions";
import { FarmerTable } from "@/components/farmer/farmer-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  /** When true, only render the sticky search toolbar (table loads separately). */
  toolbarOnly?: boolean;
  /** When true, only render table + pagination (search lives outside Suspense). */
  tableOnly?: boolean;
};

function customersListHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q.length > 0) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/farmer?${s}` : "/farmer";
}

export function FarmerListingToolbar({
  query,
  totalFiltered,
  totalAll,
  start,
  end,
  pageSize,
}: {
  query: string;
  totalFiltered: number;
  totalAll: number;
  start: number;
  end: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [nameSearch, setNameSearch] = useState(query);
  const debouncedSearch = useDebouncedValue(nameSearch, 300);
  const [exportPending, startExport] = useTransition();
  const inputFocusedRef = useRef(false);

  // Sync from URL only when the input is not focused (back/clear/external nav).
  useEffect(() => {
    if (!inputFocusedRef.current) {
      setNameSearch(query);
    }
  }, [query]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === query) return;
    router.replace(customersListHref(next, 1), { scroll: false });
  }, [debouncedSearch, query, router]);

  function exportAllFarmers() {
    startExport(async () => {
      const rows = await fetchAllFarmersForExport();
      const stamp = new Date().toISOString().slice(0, 10);
      exportCustomersToExcel(rows, `farmers-all-${stamp}.xlsx`);
    });
  }

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
            }}
            placeholder="Search farmer name or survey number..."
            className="h-[42px] rounded-full border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-[#2563EB]/30"
            aria-label="Search by farmer name or survey number"
          />
        </div>

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
          Showing <span className="font-medium tabular-nums text-slate-700">{start}–{end}</span> of{" "}
          <span className="font-medium tabular-nums text-slate-700">{totalFiltered}</span> ·{" "}
          <span className="tabular-nums">{pageSize}</span> per page
        </p>
      </div>
    </div>
  );
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
  toolbarOnly,
  tableOnly,
}: Props) {
  if (toolbarOnly) {
    return (
      <FarmerListingToolbar
        query={query}
        totalFiltered={totalFiltered}
        totalAll={totalAll}
        start={start}
        end={end}
        pageSize={pageSize}
      />
    );
  }

  const tableSection = (
    <>
      <FarmerTable customers={customers} />

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
              <Link
                href={customersListHref(query, page - 1)}
                scroll={false}
              >
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
              <Link href={customersListHref(query, page + 1)} scroll={false}>
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
    </>
  );

  if (tableOnly) {
    return <div className="flex flex-col gap-4">{tableSection}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <FarmerListingToolbar
        query={query}
        totalFiltered={totalFiltered}
        totalAll={totalAll}
        start={start}
        end={end}
        pageSize={pageSize}
      />
      {tableSection}
    </div>
  );
}
