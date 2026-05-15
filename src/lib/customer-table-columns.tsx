import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerListRow } from "@/lib/customer-list-format";
import { cellText, formatAmount, formatOptionalDate } from "@/lib/customer-display";

export const HEADER_ROW_H = 28;

export const PINNED_LEFT = ["farmerName", "changedFarmerName", "vendorCode"] as const;
export const PINNED_RIGHT = ["actions"] as const;

function extentCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return "—";
  return <span className="font-mono tabular-nums text-[#111827]">{text}</span>;
}

function moneyCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return <span className="font-mono text-[#6B7280]">—</span>;
  const negative = value != null && value < 0;
  return (
    <span
      className={`font-mono tabular-nums ${negative ? "text-[#DC2626]" : "text-[#16A34A] font-medium"}`}
    >
      {text}
    </span>
  );
}

function textCell(value: string | null | undefined) {
  return <span className="text-[#111827]">{cellText(value)}</span>;
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
  "shortageDate",
  "shortageChequeNo",
  "shortageBankName",
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
  "receivedNeftAmount",
  "receivedDate",
  "balanceReceivable",
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
    label: "AES Advance",
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
    label: "Lease Amount Issued",
    leafLabels: ["Loan", "Rent", "TDS"],
    leafIds: ["loanAmount", "rentAmount", "tdsAmount"],
  },
  {
    label: "Shortage Amount",
    leafLabels: ["Cheque Amount", "Date", "Cheque No", "Bank Name"],
    leafIds: [
      "shortageChequeAmount",
      "shortageDate",
      "shortageChequeNo",
      "shortageBankName",
    ],
  },
  {
    label: "ATL",
    leafLabels: ["Stamp Duty", "Reg Charges", "Total"],
    leafIds: ["atlStampDuty", "atlRegCharges", "atlTotal"],
  },
  {
    label: "PAO/GPA",
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
  {
    label: "Received from Company",
    leafLabels: ["NEFT Amount", "Date"],
    leafIds: ["receivedNeftAmount", "receivedDate"],
  },
  {
    label: "Balance Receivable",
    leafLabels: ["Balance Receivable"],
    leafIds: ["balanceReceivable"],
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
  "receivedNeftAmount",
  "balanceReceivable",
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

const DATE_IDS = new Set(["aesAdvanceDate", "shortageDate", "receivedDate"]);

export function getExportCellValue(
  row: CustomerListRow,
  id: (typeof LEAF_COLUMN_IDS)[number],
): string | number {
  const v = row[id as keyof CustomerListRow];
  if (DATE_IDS.has(id)) {
    const t = formatOptionalDate(v as string | null);
    return t === "—" ? "" : t;
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
      cell: ({ getValue }) => (
        <span className="font-medium">{cellText(getValue() as string)}</span>
      ),
      size: 130,
    },
    {
      id: "changedFarmerName",
      accessorKey: "changedFarmerName",
      header: "Changed Name",
      cell: ({ getValue }) => (
        <span className="text-[#6B7280]">{cellText(getValue() as string)}</span>
      ),
      size: 120,
    },
    {
      id: "vendorCode",
      accessorKey: "vendorCode",
      header: "Vendor Code",
      cell: ({ getValue }) => (
        <span className="font-mono text-[#2563EB]">{cellText(getValue() as string)}</span>
      ),
      size: 90,
    },
    {
      id: "surveyNo",
      accessorKey: "surveyNo",
      header: "Survey No",
      cell: ({ getValue }) => textCell(getValue() as string),
      size: 85,
    },
    {
      id: "newSurveyNo",
      accessorKey: "newSurveyNo",
      header: "New Survey No",
      cell: ({ getValue }) => textCell(getValue() as string),
      size: 95,
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
      header: "AES Advance",
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
      header: "Lease Amount Issued",
      columns: [
        {
          id: "loanAmount",
          accessorKey: "loanAmount",
          header: "Loan",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 80,
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
      id: "shortage",
      header: "Shortage Amount",
      columns: [
        {
          id: "shortageChequeAmount",
          accessorKey: "shortageChequeAmount",
          header: "Cheque Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 100,
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
          size: 110,
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
      header: "PAO/GPA",
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
      id: "received",
      header: "Received from Company",
      columns: [
        {
          id: "receivedNeftAmount",
          accessorKey: "receivedNeftAmount",
          header: "NEFT Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 100,
        },
        {
          id: "receivedDate",
          accessorKey: "receivedDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
      ],
    },
    {
      id: "balanceReceivable",
      accessorKey: "balanceReceivable",
      header: "Balance Receivable",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 110,
    },
    {
      id: "cropCompensation",
      accessorKey: "cropCompensation",
      header: "Crop Compensation",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 110,
    },
    actionsColumn,
  ];
}
