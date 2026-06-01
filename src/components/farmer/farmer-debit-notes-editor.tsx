"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FARMER_DEBIT_NOTE_CATEGORIES,
  farmerDebitNoteCategoryLabel,
} from "@/lib/farmer-debit-note-categories";
import type { FarmerDebitNoteInput } from "@/lib/farmer-debit-notes";

type Props = {
  initialNotes?: FarmerDebitNoteInput[];
};

function emptyRow(): FarmerDebitNoteInput {
  return {
    category: FARMER_DEBIT_NOTE_CATEGORIES[0]!.id,
    dbNo: "",
    amount: null,
    remark: "",
  };
}

export function FarmerDebitNotesEditor({ initialNotes = [] }: Props) {
  const [rows, setRows] = useState<FarmerDebitNoteInput[]>(
    initialNotes.length > 0 ? initialNotes : [],
  );

  function updateRow(index: number, patch: Partial<FarmerDebitNoteInput>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#111827]">Debit Notes</h2>
        <p className="text-xs text-[#6B7280]">Add one or more debit notes by category.</p>
      </div>
      <div className="space-y-4 p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No debit notes yet.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id ?? `new-${index}`}
              className="rounded-md border border-[#E5E7EB] bg-[#FAFBFC] p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Debit note {index + 1}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Debit Note Category</Label>
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(index, { category: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] px-3 text-sm"
                  >
                    {FARMER_DEBIT_NOTE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {!FARMER_DEBIT_NOTE_CATEGORIES.some((c) => c.id === row.category) ? (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Category: {farmerDebitNoteCategoryLabel(row.category)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label>DB Number</Label>
                  <Input
                    value={row.dbNo}
                    onChange={(e) => updateRow(index, { dbNo: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={row.amount ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateRow(index, {
                        amount: v === "" ? null : Number(v) || 0,
                      });
                    }}
                    className="mt-1 h-9 font-mono tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Remark</Label>
                  <Textarea
                    value={row.remark}
                    onChange={(e) => updateRow(index, { remark: e.target.value })}
                    className="mt-1 min-h-[64px]"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((p) => [...p, emptyRow()])}>
          <Plus className="h-4 w-4" />
          Add Debit Note
        </Button>
      </div>
      <input type="hidden" name="debitNotesJson" value={JSON.stringify(rows)} readOnly />
    </section>
  );
}
