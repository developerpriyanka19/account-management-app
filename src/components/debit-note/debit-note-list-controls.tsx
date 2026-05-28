"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialQuery: string;
  initialType: string;
  initialStatus: string;
  initialDate: string;
};

export function DebitNoteListControls({
  initialQuery,
  initialType,
  initialStatus,
  initialDate,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState(initialStatus);
  const [date, setDate] = useState(initialDate);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const landActive = pathname === "/debit-note/land-conversion";
  const atlActive = pathname === "/debit-note/atl-poa-gpa";

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      if (type && type !== "all") params.set("type", type);
      else params.delete("type");
      if (status && status !== "all") params.set("status", status);
      else params.delete("status");
      if (date) params.set("date", date);
      else params.delete("date");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, type, status, date, pathname, router, searchParams]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#D1D5DB] bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by debit note no or customer name"
          className="w-full md:max-w-md"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827]"
        >
          <option value="all">All Types</option>
          <option value="land-conversion">Land Conversion</option>
          <option value="atl-poa-gpa">ATL and POA/GPA</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827]"
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Generated</option>
        </select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:max-w-[180px]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={landActive ? "default" : "outline"}
          onClick={() => router.push("/debit-note/land-conversion")}
        >
          New Land Conversion
        </Button>
        <Button
          type="button"
          variant={atlActive ? "default" : "outline"}
          onClick={() => router.push("/debit-note/atl-poa-gpa")}
        >
          New ATL and POA/GPA
        </Button>
      </div>
    </div>
  );
}
