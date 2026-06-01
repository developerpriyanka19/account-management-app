import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  cellText,
  formatAmount,
  formatIntegerAmount,
  formatOptionalDate,
} from "@/lib/customer-display";

export const HEADER_ROW_H = 44;

export const PINNED_LEFT = ["farmerName", "changedFarmerName", "vendorCode"] as const;
export const PINNED_RIGHT = ["actions"] as const;

function extentCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") {
    return <span className="block min-w-0 truncate text-right font-mono text-[#6B7280]">—</span>;
  }
  return (
    <span className="block min-w-0 truncate text-right font-mono tabular-nums text-[#111827]" title={text}>
      {text}
    </span>
  );
}

function moneyCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") {
    return <span className="block min-w-0 truncate text-right font-mono text-[#6B7280]">—</span>;
  }
  const negative = value != null && value < 0;
  return (
    <span
      className={`block min-w-0 truncate text-right font-mono tabular-nums ${negative ? "text-[#DC2626]" : "text-[#16A34A] font-semibold"}`}
      title={text}
    >
      {text}
    </span>
  );
}

function integerMoneyCell(value: number | null | undefined) {
  const text = formatIntegerAmount(value);
  if (text === "—") {
    return <span className="block min-w-0 truncate text-right font-mono text-[#6B7280]">—</span>;
  }
  const negative = value != null && value < 0;
  return (
    <span
      className={`block min-w-0 truncate text-right font-mono tabular-nums ${negative ? "text-[#DC2626]" : "text-[#16A34A] font-semibold"}`}
      title={text}
    >
      {text}
    </span>
  );
}

function textCell(value: string | null | undefined) {
  const text = cellText(value);
  return (
    <span className="block min-w-0 truncate text-[#111827]" title={text !== "—" ? text : undefined}>
      {text}
    </span>
  );
}

function remarkCell(value: string | null | undefined) {
  const text = cellText(value);
  return (
    <span
      className="block min-w-0 whitespace-normal break-words leading-snug text-[#111827]"
      title={text !== "—" ? text : undefined}
    >
      {text}
    </span>
  );
}

function dateCell(value: string | null | undefined) {
  return <span className="text-[#6B7280]">{formatOptionalDate(value)}</span>;
}

/** Leaf column ids in display order (for export). */
export const LEAF_COLUMN_IDS = [
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
  "rtcExtentAcre",
  "rtcExtentGunta",
  "rtcAKharab",
  "rtcBKharab",
  "balanceExtentAcre",
  "balanceExtentGunta",
  "leaseExtentAcre",
  "leaseExtentGunta",
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "aesAdvanceChequeAmount",
  "aesAdvanceDate",
  "aesAdvanceChequeNo",
  "aesAdvanceBankName",
  "balanceRentAmount",
  "loanAmount",
  "rentAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "shortageAmountFirstTime",
  "shortageAmountSecondTime",
  "shortageDate",
  "shortageChequeNo",
  "shortageBankName",
  "shortageSecondDate",
  "shortageSecondChequeNo",
  "shortageSecondBankName",
  "atlStampDuty",
  "atlRegCharges",
  "atlTotal",
  "paoStampDuty",
  "paoRegCharges",
  "paoTotal",
  "landConversion",
  "podiFee",
  "leaseDeedStampDuty",
  "leaseDeedRegCharges",
  "debitNoteNo",
  "debitNoteAmount",
  "remark",
  "otherCharges",
  "cropCompensation",
] as const;

export type ExportGroup = {
  label: string;
  leafLabels: string[];
  leafIds: (typeof LEAF_COLUMN_IDS)[number][];
};

/** Grouped header structure for Excel export (row 0 merges). */
export const EXPORT_GROUPS: ExportGroup[] = [
  { label: "Farmer Name", leafLabels: ["Farmer Name"], leafIds: ["farmerName"] },
  { label: "Changed Name", leafLabels: ["Changed Name"], leafIds: ["changedFarmerName"] },
  { label: "Vendor Code", leafLabels: ["Vendor Code"], leafIds: ["vendorCode"] },
  { label: "Survey No", leafLabels: ["Survey No"], leafIds: ["surveyNo"] },
  { label: "New Survey No", leafLabels: ["New Survey No"], leafIds: ["newSurveyNo"] },
  {
    label: "RTC Extent",
    leafLabels: ["Acre", "Gunta", "A Kharab", "B Kharab"],
    leafIds: ["rtcExtentAcre", "rtcExtentGunta", "rtcAKharab", "rtcBKharab"],
  },
  {
    label: "Balance Extent",
    leafLabels: ["Acre", "Gunta"],
    leafIds: ["balanceExtentAcre", "balanceExtentGunta"],
  },
  {
    label: "Lease Extent",
    leafLabels: ["Acre", "Gunta"],
    leafIds: ["leaseExtentAcre", "leaseExtentGunta"],
  },
  { label: "Total Gunta", leafLabels: ["Total Gunta"], leafIds: ["totalGunta"] },
  { label: "Total Cents", leafLabels: ["Total Cents"], leafIds: ["totalCents"] },
  { label: "Rent Per Acre", leafLabels: ["Rent Per Acre"], leafIds: ["rentPerAcre"] },
  {
    label: "AES Advance per Acre",
    leafLabels: ["Cheque Amount", "Date", "Cheque No", "Bank Name"],
    leafIds: [
      "aesAdvanceChequeAmount",
      "aesAdvanceDate",
      "aesAdvanceChequeNo",
      "aesAdvanceBankName",
    ],
  },
  {
    label: "Balance Rent Amount",
    leafLabels: ["Balance Rent"],
    leafIds: ["balanceRentAmount"],
  },
  {
    label: "Bank Loan",
    leafLabels: ["Bank Loan", "Rent", "TDS"],
    leafIds: ["loanAmount", "rentAmount", "tdsAmount"],
  },
  {
    label: "Shortage Amount Through Cheque (1st Time)",
    leafLabels: ["Amount", "Date", "Cheque No", "Bank Name"],
    leafIds: [
      "shortageChequeAmount",
      "shortageDate",
      "shortageChequeNo",
      "shortageBankName",
    ],
  },
  {
    label: "Shortage Amount Through Cheque (2nd Time)",
    leafLabels: ["Amount", "Date", "Cheque No", "Bank Name"],
    leafIds: [
      "shortageAmountSecondTime",
      "shortageSecondDate",
      "shortageSecondChequeNo",
      "shortageSecondBankName",
    ],
  },
  {
    label: "ATL",
    leafLabels: ["Stamp Duty", "Reg Charges", "Total"],
    leafIds: ["atlStampDuty", "atlRegCharges", "atlTotal"],
  },
  {
    label: "POA/GPA",
    leafLabels: ["Stamp Duty", "Reg Charges", "Total"],
    leafIds: ["paoStampDuty", "paoRegCharges", "paoTotal"],
  },
  {
    label: "NA",
    leafLabels: ["Land Conversion", "Podi Fee"],
    leafIds: ["landConversion", "podiFee"],
  },
  {
    label: "Lease Deed",
    leafLabels: ["Stamp Duty", "Reg Charges"],
    leafIds: ["leaseDeedStampDuty", "leaseDeedRegCharges"],
  },
  {
    label: "Debit Note",
    leafLabels: ["DB No", "Amount"],
    leafIds: ["debitNoteNo", "debitNoteAmount"],
  },
  { label: "Remark", leafLabels: ["Remark"], leafIds: ["remark"] },
  {
    label: "Other Charges",
    leafLabels: ["Other Charges"],
    leafIds: ["otherCharges"],
  },
  {
    label: "Crop Compensation",
    leafLabels: ["Crop Compensation"],
    leafIds: ["cropCompensation"],
  },
];

const MONEY_IDS = new Set<string>([
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "aesAdvanceChequeAmount",
  "balanceRentAmount",
  "loanAmount",
  "rentAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "shortageAmountSecondTime",
  "atlStampDuty",
  "atlRegCharges",
  "atlTotal",
  "paoStampDuty",
  "paoRegCharges",
  "paoTotal",
  "landConversion",
  "podiFee",
  "leaseDeedStampDuty",
  "leaseDeedRegCharges",
  "debitNoteAmount",
  "otherCharges",
  "cropCompensation",
  "rtcExtentAcre",
  "rtcExtentGunta",
  "rtcAKharab",
  "rtcBKharab",
  "balanceExtentAcre",
  "balanceExtentGunta",
  "leaseExtentAcre",
  "leaseExtentGunta",
]);

const DATE_IDS = new Set(["aesAdvanceDate", "shortageDate", "shortageSecondDate"]);

/** Leaf column ids rendered as right-aligned currency / numeric amounts in the table. */
export const MONEY_COLUMN_IDS = MONEY_IDS;

export function getExportCellValue(
  row: CustomerListRow,
  id: (typeof LEAF_COLUMN_IDS)[number],
): string | number {
  if (id === "remark") {
    const t = cellText(row.notes);
    return t === "—" ? "" : t;
  }
  const v = row[id as keyof CustomerListRow];
  if (DATE_IDS.has(id)) {
    const t = formatOptionalDate(v as string | null);
    return t === "—" ? "" : t;
  }
  if (id === "cropCompensation") {
    if (v == null || Number.isNaN(v as number)) return "";
    return Math.round(v as number);
  }
  if (MONEY_IDS.has(id)) {
    if (v == null || Number.isNaN(v as number)) return "";
    return v as number;
  }
  const t = cellText(v as string | null);
  return t === "—" ? "" : t;
}

export function buildCustomerTableColumns(
  actionsColumn: ColumnDef<CustomerListRow>,
): ColumnDef<CustomerListRow>[] {
  return [
    {
      id: "farmerName",
      accessorKey: "farmerName",
      header: "Farmer Name",
      cell: ({ getValue }) => {
        const value = cellText(getValue() as string);
        return (
          <span className="block whitespace-normal break-words leading-[1.4] font-medium" title={value}>
            {value}
          </span>
        );
      },
      size: 160,
      minSize: 160,
      maxSize: 160,
    },
    {
      id: "changedFarmerName",
      accessorKey: "changedFarmerName",
      header: "Changed Name",
      cell: ({ getValue }) => (
        <span className="text-[#6B7280]">{cellText(getValue() as string)}</span>
      ),
      size: 140,
      minSize: 140,
      maxSize: 140,
    },
    {
      id: "vendorCode",
      accessorKey: "vendorCode",
      header: "Vendor Code",
      cell: ({ getValue }) => (
        <span className="font-mono text-[#2563EB]">{cellText(getValue() as string)}</span>
      ),
      size: 120,
      minSize: 120,
      maxSize: 120,
    },
    {
      id: "surveyNo",
      accessorKey: "surveyNo",
      header: "Survey No",
      cell: ({ getValue }) => textCell(getValue() as string),
      size: 120,
      minSize: 120,
      maxSize: 120,
    },
    {
      id: "newSurveyNo",
      accessorKey: "newSurveyNo",
      header: "New Survey No",
      cell: ({ getValue }) => textCell(getValue() as string),
      size: 95,
      minSize: 90,
    },
    {
      id: "rtcExtent",
      header: "RTC Extent",
      columns: [
        {
          id: "rtcExtentAcre",
          accessorKey: "rtcExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
        {
          id: "rtcExtentGunta",
          accessorKey: "rtcExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
        {
          id: "rtcAKharab",
          accessorKey: "rtcAKharab",
          header: "A Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 78,
        },
        {
          id: "rtcBKharab",
          accessorKey: "rtcBKharab",
          header: "B Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 78,
        },
      ],
    },
    {
      id: "balanceExtent",
      header: "Balance Extent",
      columns: [
        {
          id: "balanceExtentAcre",
          accessorKey: "balanceExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
        {
          id: "balanceExtentGunta",
          accessorKey: "balanceExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
      ],
    },
    {
      id: "leaseExtent",
      header: "Lease Extent",
      columns: [
        {
          id: "leaseExtentAcre",
          accessorKey: "leaseExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
        {
          id: "leaseExtentGunta",
          accessorKey: "leaseExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 72,
        },
      ],
    },
    {
      id: "totalGunta",
      accessorKey: "totalGunta",
      header: "Total Gunta",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 88,
    },
    {
      id: "totalCents",
      accessorKey: "totalCents",
      header: "Total Cents",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 88,
    },
    {
      id: "rentPerAcre",
      accessorKey: "rentPerAcre",
      header: "Rent / Acre",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 88,
    },
    {
      id: "aesAdvance",
      header: "AES Advance per Acre",
      columns: [
        {
          id: "aesAdvanceChequeAmount",
          accessorKey: "aesAdvanceChequeAmount",
          header: "Cheque Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 100,
        },
        {
          id: "aesAdvanceDate",
          accessorKey: "aesAdvanceDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "aesAdvanceChequeNo",
          accessorKey: "aesAdvanceChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "aesAdvanceBankName",
          accessorKey: "aesAdvanceBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "balanceRentAmount",
      accessorKey: "balanceRentAmount",
      header: "Balance Rent",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 95,
    },
    {
      id: "leaseIssued",
      header: "Bank Loan",
      columns: [
        {
          id: "loanAmount",
          accessorKey: "loanAmount",
          header: "Bank Loan",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 100,
          minSize: 92,
        },
        {
          id: "rentAmount",
          accessorKey: "rentAmount",
          header: "Rent",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 80,
        },
        {
          id: "tdsAmount",
          accessorKey: "tdsAmount",
          header: "TDS",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 72,
        },
      ],
    },
    {
      id: "shortagePart1",
      header: "Shortage Amount Through Cheque (1st Time)",
      columns: [
        {
          id: "shortageChequeAmount",
          accessorKey: "shortageChequeAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 92,
        },
        {
          id: "shortageDate",
          accessorKey: "shortageDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "shortageChequeNo",
          accessorKey: "shortageChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "shortageBankName",
          accessorKey: "shortageBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 95,
        },
      ],
    },
    {
      id: "shortagePart2",
      header: "Shortage Amount Through Cheque (2nd Time)",
      columns: [
        {
          id: "shortageAmountSecondTime",
          accessorKey: "shortageAmountSecondTime",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 92,
        },
        {
          id: "shortageSecondDate",
          accessorKey: "shortageSecondDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "shortageSecondChequeNo",
          accessorKey: "shortageSecondChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 92,
        },
        {
          id: "shortageSecondBankName",
          accessorKey: "shortageSecondBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 120,
        },
      ],
    },
    {
      id: "atl",
      header: "ATL",
      columns: [
        {
          id: "atlStampDuty",
          accessorKey: "atlStampDuty",
          header: "Stamp Duty",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
        {
          id: "atlRegCharges",
          accessorKey: "atlRegCharges",
          header: "Reg Charges",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
        {
          id: "atlTotal",
          accessorKey: "atlTotal",
          header: "Total",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 80,
        },
      ],
    },
    {
      id: "pao",
      header: "POA/GPA",
      columns: [
        {
          id: "paoStampDuty",
          accessorKey: "paoStampDuty",
          header: "Stamp Duty",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
        {
          id: "paoRegCharges",
          accessorKey: "paoRegCharges",
          header: "Reg Charges",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
        {
          id: "paoTotal",
          accessorKey: "paoTotal",
          header: "Total",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 80,
        },
      ],
    },
    {
      id: "na",
      header: "NA",
      columns: [
        {
          id: "landConversion",
          accessorKey: "landConversion",
          header: "Land Conversion",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 105,
        },
        {
          id: "podiFee",
          accessorKey: "podiFee",
          header: "Podi Fee",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 85,
        },
      ],
    },
    {
      id: "leaseDeed",
      header: "Lease Deed",
      columns: [
        {
          id: "leaseDeedStampDuty",
          accessorKey: "leaseDeedStampDuty",
          header: "Stamp Duty",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
        {
          id: "leaseDeedRegCharges",
          accessorKey: "leaseDeedRegCharges",
          header: "Reg Charges",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 88,
        },
      ],
    },
    {
      id: "debitNote",
      header: "Debit Note",
      columns: [
        {
          id: "debitNoteNo",
          accessorKey: "debitNoteNo",
          header: "DB No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 85,
        },
        {
          id: "debitNoteAmount",
          accessorKey: "debitNoteAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 85,
        },
      ],
    },
    {
      id: "remark",
      accessorKey: "notes",
      header: "Remark",
      cell: ({ getValue }) => remarkCell(getValue() as string),
      size: 140,
      minSize: 120,
      maxSize: 200,
    },
    {
      id: "otherCharges",
      accessorKey: "otherCharges",
      header: "Other Charges",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 95,
    },
    {
      id: "cropCompensation",
      accessorKey: "cropCompensation",
      header: "Crop Compensation",
      cell: ({ getValue }) => integerMoneyCell(getValue() as number),
      size: 105,
    },
    actionsColumn,
  ];
}
