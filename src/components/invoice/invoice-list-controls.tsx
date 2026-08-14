"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { InvoiceListSortField } from "@/app/invoice/actions";

type Props = {
  initialQuery: string;
  createHref: string;
  createLabel: string;
  sort: InvoiceListSortField;
  sortDir: "asc" | "desc";
};

export function InvoiceListControls({
  initialQuery,
  createHref,
  createLabel,
  sort,
  sortDir,
}: Props) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname, router, searchParams, value]);

  function toggleSort(field: InvoiceListSortField) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === field) {
      params.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("sortDir", "desc");
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by invoice number or customer name"
          className="w-full sm:max-w-md"
        />
        <Button
          type="button"
          onClick={() => router.push(createHref)}
          className="inline-flex h-9 items-center justify-center bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
        >
          {createLabel}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
        <span className="font-medium text-[#374151]">Sort:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleSort("date")}
          className={sort === "date" ? "border-[#2563EB] text-[#2563EB]" : ""}
        >
          Date {sort === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleSort("amount")}
          className={sort === "amount" ? "border-[#2563EB] text-[#2563EB]" : ""}
        >
          Amount {sort === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </Button>
      </div>
    </div>
  );
}
