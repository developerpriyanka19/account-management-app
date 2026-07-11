"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import type { DebitNoteListSortField } from "@/actions/debit-note-actions";
import type { DebitNoteCustomerOption } from "@/lib/debit-note-types";

type Props = {
  initialQuery: string;
  initialStatus: string;
  initialCustomerId: string;
  initialDateFrom: string;
  initialDateTo: string;
  createHref: string;
  createLabel: string;
  sort: DebitNoteListSortField;
  sortDir: "asc" | "desc";
  customers: DebitNoteCustomerOption[];
};

export function DebitNoteListControls({
  initialQuery,
  initialStatus,
  initialCustomerId,
  initialDateFrom,
  initialDateTo,
  createHref,
  createLabel,
  sort,
  sortDir,
  customers,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      if (status && status !== "all") params.set("status", status);
      else params.delete("status");
      if (customerId) params.set("customerId", customerId);
      else params.delete("customerId");
      if (dateFrom) params.set("dateFrom", dateFrom);
      else params.delete("dateFrom");
      if (dateTo) params.set("dateTo", dateTo);
      else params.delete("dateTo");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, status, customerId, dateFrom, dateTo, pathname, router, searchParams]);

  function toggleSort(field: DebitNoteListSortField) {
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by debit note number, customer, village, or farmer name"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <DateInput
          value={dateFrom}
          onChange={(value) => setDateFrom(value)}
          className="w-full sm:max-w-[160px]"
          aria-label="Date from"
        />
        <DateInput
          value={dateTo}
          onChange={(value) => setDateTo(value)}
          className="w-full sm:max-w-[160px]"
          aria-label="Date to"
        />
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="h-9 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] sm:max-w-[220px]"
        >
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] sm:max-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
        </select>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleSort("customer")}
          className={sort === "customer" ? "border-[#2563EB] text-[#2563EB]" : ""}
        >
          Customer {sort === "customer" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </Button>
      </div>
    </div>
  );
}
