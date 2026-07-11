"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayStorageDate } from "@/lib/date-format";
import type { ReportPeriodPreset } from "@/lib/reports-period";

const selectClassName =
  "mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm";

type LocationOptions = {
  states: string[];
  districts: string[];
  taluks: string[];
  hobblis: string[];
  villages: string[];
};

export function ReportLocationFilters({
  options,
  values,
}: {
  options: LocationOptions;
  values: {
    state: string;
    district: string;
    taluk: string;
    hobbli: string;
    village: string;
    q: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <div className="print:hidden grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label>State</Label>
        <select
          className={selectClassName}
          value={values.state}
          disabled={pending}
          onChange={(e) =>
            update({
              state: e.target.value,
              district: "",
              taluk: "",
              hobbli: "",
              village: "",
            })
          }
        >
          <option value="">All states</option>
          {options.states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>District</Label>
        <select
          className={selectClassName}
          value={values.district}
          disabled={pending || !values.state}
          onChange={(e) =>
            update({ district: e.target.value, taluk: "", hobbli: "", village: "" })
          }
        >
          <option value="">All districts</option>
          {options.districts.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Taluk</Label>
        <select
          className={selectClassName}
          value={values.taluk}
          disabled={pending || !values.district}
          onChange={(e) => update({ taluk: e.target.value, hobbli: "", village: "" })}
        >
          <option value="">All taluks</option>
          {options.taluks.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Hobli</Label>
        <select
          className={selectClassName}
          value={values.hobbli}
          disabled={pending || !values.taluk}
          onChange={(e) => update({ hobbli: e.target.value, village: "" })}
        >
          <option value="">All hoblis</option>
          {options.hobblis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Village</Label>
        <select
          className={selectClassName}
          value={values.village}
          disabled={pending || !values.hobbli}
          onChange={(e) => update({ village: e.target.value })}
        >
          <option value="">All villages</option>
          {options.villages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Search name / survey</Label>
        <Input
          className="mt-1"
          defaultValue={values.q}
          placeholder="Farmer name or survey no"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update({ q: (e.target as HTMLInputElement).value.trim() });
            }
          }}
          onBlur={(e) => update({ q: e.target.value.trim() })}
        />
      </div>
    </div>
  );
}

export function ReportPeriodFilters({
  preset,
  dateFrom,
  dateTo,
}: {
  preset: ReportPeriodPreset;
  dateFrom: string;
  dateTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const maxDate = todayStorageDate();

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <div className="print:hidden grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div>
        <Label>Period</Label>
        <select
          className={selectClassName}
          value={preset}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as ReportPeriodPreset;
            update({
              preset: next,
              ...(next !== "custom" ? { dateFrom: "", dateTo: "" } : {}),
            });
          }}
        >
          <option value="annual">Annual</option>
          <option value="last6">Last 6 Months</option>
          <option value="last3">Last 3 Months</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {preset === "custom" ? (
        <>
          <div>
            <Label>From</Label>
            <div className="mt-1">
              <DateInput
                value={dateFrom}
                clearable
                maxStorageDate={maxDate}
                onChange={(value) => update({ dateFrom: value })}
                aria-label="From date"
              />
            </div>
          </div>
          <div>
            <Label>To</Label>
            <div className="mt-1">
              <DateInput
                value={dateTo}
                clearable
                maxStorageDate={maxDate}
                onChange={(value) => update({ dateTo: value })}
                aria-label="To date"
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ReportToolbar({
  title,
  backHref = "/reports",
  onExport,
  onImport,
  onDownloadTemplate,
  onPrint,
}: {
  title: string;
  backHref?: string;
  onExport?: () => void;
  onImport?: () => void;
  onDownloadTemplate?: () => void;
  onPrint?: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href={backHref} className="print:hidden text-sm text-blue-600 hover:underline">
          ← Reports
        </Link>
        <h1 className="text-2xl font-semibold text-[#111827]">{title}</h1>
      </div>
      <div className="print:hidden flex flex-wrap gap-2">
        {onDownloadTemplate ? (
          <Button type="button" variant="outline" size="sm" onClick={onDownloadTemplate}>
            Sample Template
          </Button>
        ) : null}
        {onImport ? (
          <Button type="button" variant="outline" size="sm" onClick={onImport}>
            Import
          </Button>
        ) : null}
        {onExport ? (
          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            Export Excel
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrint ?? (() => window.print())}
        >
          Print
        </Button>
      </div>
    </header>
  );
}

export function ReportPagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const searchParams = useSearchParams();
  const router = useRouter();

  if (totalPages <= 1) {
    return (
      <p className="print:hidden text-sm text-slate-500">
        {total} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  function go(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="print:hidden flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
