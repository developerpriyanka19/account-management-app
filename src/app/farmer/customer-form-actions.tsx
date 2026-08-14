import Link from "next/link";

export function CustomerFormActions({
  cancelHref,
  submitLabel,
  pendingLabel,
  isPending,
}: {
  cancelHref: string;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[#D1D5DB] pt-4 sm:flex-row sm:justify-end">
      <Link
        href={cancelHref}
        className="inline-flex h-8 items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-xs font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-8 items-center justify-center rounded-md bg-[#2563EB] px-4 text-xs font-medium text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}
