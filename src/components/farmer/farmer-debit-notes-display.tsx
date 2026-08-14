import { formatAmount, cellText } from "@/lib/customer-display";
import { farmerDebitNoteCategoryLabel } from "@/lib/farmer-debit-note-categories";
import type { FarmerDebitNoteRecord } from "@/lib/farmer-debit-notes";

type Props = {
  notes: FarmerDebitNoteRecord[];
};

export function FarmerDebitNotesDisplay({ notes }: Props) {
  if (notes.length === 0) {
    return (
      <section className="overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
          <h2 className="text-sm font-semibold text-[#111827]">Debit Notes</h2>
        </div>
        <p className="px-4 py-6 text-sm text-[#6B7280]">No debit notes recorded.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#111827]">Debit Notes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-[#F3F4F6] text-left text-[#374151]">
            <tr>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">DB No</th>
              <th className="px-3 py-2 font-semibold text-right">Amount</th>
              <th className="px-3 py-2 font-semibold">Remark</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t border-[#E5E7EB]">
                <td className="px-3 py-2 font-medium">
                  {farmerDebitNoteCategoryLabel(note.category)}
                </td>
                <td className="px-3 py-2 font-mono">{cellText(note.dbNo)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-[#16A34A]">
                  {formatAmount(note.amount)}
                </td>
                <td className="px-3 py-2 whitespace-pre-wrap">{cellText(note.remark)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
