"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Search, Star, Trash2 } from "lucide-react";
import {
  deleteBankDetail,
  setDefaultBankDetail,
} from "@/actions/bank-details-actions";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BankDetailsRow } from "@/lib/bank-details-types";

type Props = {
  rows: BankDetailsRow[];
  total: number;
  query: string;
  page: number;
  pageSize: number;
};

function listHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/invoice/bank-details?${s}` : "/invoice/bank-details";
}

export function BankDetailsListing({ rows, total, query, page, pageSize }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(query);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => setSearch(query), [query]);

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(listHref(search.trim(), 1));
  }

  function confirmDelete() {
    if (deleteId == null) return;
    startTransition(async () => {
      const result = await deleteBankDetail(deleteId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Bank details deleted.");
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleSetDefault(id: number) {
    startTransition(async () => {
      const result = await setDefaultBankDetail(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Default bank updated.");
      router.refresh();
    });
  }

  if (rows.length === 0 && !query) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={runSearch} className="flex flex-1 gap-2 sm:max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank name, holder, account, IFSC…"
            />
            <Button type="submit" variant="outline" size="icon" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Link
            href="/invoice/bank-details/create"
            className="inline-flex h-8 items-center justify-center rounded-md bg-[#2563EB] px-3 text-xs font-medium text-white hover:bg-[#1D4ED8]"
          >
            + Add Bank Details
          </Link>
        </div>
        <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
          <p className="text-base font-medium text-[#111827]">No bank details found.</p>
          <Link
            href="/invoice/bank-details/create"
            className="mt-4 inline-flex h-8 items-center justify-center rounded-md bg-[#2563EB] px-3 text-xs font-medium text-white hover:bg-[#1D4ED8]"
          >
            Add Bank Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={runSearch} className="flex flex-1 gap-2 sm:max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank name, holder, account, IFSC…"
            />
            <Button type="submit" variant="outline" size="icon" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Link
            href="/invoice/bank-details/create"
            className="inline-flex h-8 items-center justify-center rounded-md bg-[#2563EB] px-3 text-xs font-medium text-white hover:bg-[#1D4ED8]"
          >
            + Add Bank Details
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#F3F4F6] text-[#374151]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Bank Name</th>
                <th className="px-3 py-2 text-left font-semibold">Account Holder Name</th>
                <th className="px-3 py-2 text-left font-semibold">Account Number</th>
                <th className="px-3 py-2 text-left font-semibold">IFSC Code</th>
                <th className="px-3 py-2 text-left font-semibold">Branch</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Default</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[#6B7280]">
                    No bank details match your search.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                    <td className="px-3 py-2">{row.bankName}</td>
                    <td className="px-3 py-2">{row.accountHolderName}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.accountNumber}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.ifscCode}</td>
                    <td className="px-3 py-2">{row.branchName || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          row.isActive
                            ? "inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]"
                            : "inline-flex rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#6B7280]"
                        }
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {row.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#854D0E]">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          Default
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/invoice/bank-details/${row.id}/edit`}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[11px] font-medium text-[#111827] hover:bg-[#F5F7FA]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending || row.isDefault}
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                        {!row.isDefault ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => handleSetDefault(row.id)}
                          >
                            Set Default
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-[#6B7280]">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(listHref(query, page - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(listHref(query, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete bank details?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
