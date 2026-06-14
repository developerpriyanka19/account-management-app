import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { hasBankSnapshot } from "@/lib/bank-details-types";

type Props = {
  bank: BankDetailsSnapshot | null | undefined;
  className?: string;
};

export function BankDetailsDisplay({ bank, className }: Props) {
  if (!hasBankSnapshot(bank) || !bank) return null;

  const rows: { label: string; value: string }[] = [
    { label: "Bank Name:", value: bank.bankName },
    { label: "Name:", value: bank.accountHolderName },
    { label: "Account No:", value: bank.accountNumber },
    { label: "IFSC:", value: bank.ifscCode },
  ];
  if (bank.branchName?.trim()) {
    rows.push({ label: "Branch:", value: bank.branchName.trim() });
  }

  return (
    <div className={className ?? "mt-4 text-left text-[7px] leading-snug text-[#111827]"}>
      <p className="font-bold">Account Details:</p>
      {rows.map((row) => (
        <p key={row.label}>
          <span className="font-bold">{row.label}</span> {row.value}
        </p>
      ))}
    </div>
  );
}
