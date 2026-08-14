"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  initialQuery: string;
};

export function NaInvoiceListControls({ initialQuery }: Props) {
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by customer or invoice number"
        className="w-full sm:max-w-md"
      />
      <Button
        type="button"
        onClick={() => router.push("/invoice/na/new")}
        className="inline-flex h-9 items-center justify-center bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
      >
        New Invoice
      </Button>
    </div>
  );
}
