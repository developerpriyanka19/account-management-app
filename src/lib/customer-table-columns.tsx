import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  cellText,
  formatAmount,
  formatIntegerAmount,
  formatOptionalDate,
} from "@/lib/customer-display";

export const HEADER_ROW_H = 44;

export const FARMER_DETAILS_GROUP_ID = "farmerDetails";
export const SURVEY_FIELDS_GROUP_ID = "surveyFields";
export const ACTIONS_GROUP_ID = "actionsGroup";
export const ACTIONS_COLUMN_ID = "actions";
export const ACTIONS_COLUMN_WIDTH = 160;

export const PINNED_LEFT = ["farmerName", "changedFarmerName", "vendorCode"] as const;
export const PINNED_RIGHT = [ACTIONS_COLUMN_ID] as const;

type CustomerColumnMeta = {
  suppressSubHeader?: boolean;
};

function columnGroup(
  groupId: string,
  parentLabel: string,
  leaf: ColumnDef<CustomerListRow>,
  opts?: { subHeader?: string | null },
): ColumnDef<CustomerListRow> {
  const suppressSubHeader = opts?.subHeader === null;
  const subHeader = suppressSubHeader ? "" : (opts?.subHeader ?? parentLabel);
  return {
    id: groupId,
    header: parentLabel,
    columns: [
      {
        ...leaf,
        header: subHeader,
        meta: {
          ...((leaf.meta as CustomerColumnMeta | undefined) ?? {}),
          suppressSubHeader,
        },
      },
    ],
  };
}

export function tableTotalWidth(
  leafColumns: { id: string; columnDef: { size?: number } }[],
): number {
  return leafColumns.reduce((sum, col) => sum + (col.columnDef.size ?? 100), 0);
}

export function pinnedLeftTotalWidth(
  leafColumns: { id: string; columnDef: { size?: number } }[],
): number {
  return PINNED_LEFT.reduce((sum, id) => {
    const col = leafColumns.find((c) => c.id === id);
    if (!col) return sum;
    return sum + (col.columnDef.size ?? 100);
  }, 0);
}

const AMOUNT_CELL_INNER =
  "amount-cell block text-right font-mono tabular-nums whitespace-normal break-words leading-snug [overflow-wrap:anywhere]";

function amountCellSpan(text: string, tone: "empty" | "extent" | "money", negative = false) {
  if (tone === "empty") {
    return <span className={`${AMOUNT_CELL_INNER} text-[#6B7280]`}>—</span>;
  }
  if (tone === "extent") {
    return <span className={`${AMOUNT_CELL_INNER} text-[#111827]`}>{text}</span>;
  }
  return (
    <span
      className={`${AMOUNT_CELL_INNER} ${negative ? "text-[#DC2626]" : "text-[#16A34A] font-semibold"}`}
    >
      {text}
    </span>
  );
}

function extentCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  return amountCellSpan(text, "extent");
}

function moneyCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  const negative = value != null && value < 0;
  return amountCellSpan(text, "money", negative);
}

function integerMoneyCell(value: number | null | undefined) {
  const text = formatIntegerAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  const negative = value != null && value < 0;
  return amountCellSpan(text, "money", negative);
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

export function computeLeaseDeedGovtFee(row: CustomerListRow): number | null {
  const stamp = row.leaseDeedStampDuty;
  const reg = row.leaseDeedRegCharges;
  if (stamp == null && reg == null) return null;
  const total = (stamp ?? 0) + (reg ?? 0);
  return Number.isNaN(total) ? null : total;
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
  "rentAmount",
  "aesAdvanceDate",
  "aesAdvanceChequeNo",
  "aesAdvanceChequeAmount",
  "aesAdvanceBankName",
  "balanceRentAmount",
  "tdsAmount",
  "bankLoanDdDate",
  "loanAmount",
  "bankLoanDdNo",
  "bankLoanBankName",
  "rentalDdDate",
  "leaseAmount",
  "rentalDdChequeNo",
  "rentalDdBankName",
  "shortageChequeAmount",
  "shortageDate",
  "shortageChequeNo",
  "shortageBankName",
  "atlTotal",
  "paoTotal",
  "landConversion",
  "podiFee",
  "leaseDeedGovtFee",
  "debitNoteNo",
  "debitNoteAmount",
  "remark",
  "otherCharges",
  "cropCompensation",
] as const;

export type LeafColumnId = (typeof LEAF_COLUMN_IDS)[number];

export type ExportGroup = {
  label: string;
  leafLabels: string[];
  leafIds: LeafColumnId[];
};

/** Grouped header structure for Excel export (row 0 merges). */
export const EXPORT_GROUPS: ExportGroup[] = [
  {
    label: "Farmer Details",
    leafLabels: ["Farmer Name", "Changed Name", "Vendor Code"],
    leafIds: ["farmerName", "changedFarmerName", "vendorCode"],
  },
  {
    label: "",
    leafLabels: ["Survey No", "New Survey No"],
    leafIds: ["surveyNo", "newSurveyNo"],
  },
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
  { label: "Total Rent", leafLabels: ["Total Rent"], leafIds: ["rentAmount"] },
  {
    label: "AES Advance Per Acre",
    leafLabels: ["Date", "Cheque no", "cheque amount", "Bank name"],
    leafIds: [
      "aesAdvanceDate",
      "aesAdvanceChequeNo",
      "aesAdvanceChequeAmount",
      "aesAdvanceBankName",
    ],
  },
  {
    label: "Balance Rent Amount",
    leafLabels: ["Balance Rent Amount"],
    leafIds: ["balanceRentAmount"],
  },
  { label: "TDS Amount", leafLabels: ["TDS Amount"], leafIds: ["tdsAmount"] },
  {
    label: "Bank Loan DD From Company",
    leafLabels: ["Date", "Amount", "DD no", "Bank name"],
    leafIds: ["bankLoanDdDate", "loanAmount", "bankLoanDdNo", "bankLoanBankName"],
  },
  {
    label: "Rental DD From Company",
    leafLabels: ["Date", "Amount", "Cheque no", "Bank name"],
    leafIds: ["rentalDdDate", "leaseAmount", "rentalDdChequeNo", "rentalDdBankName"],
  },
  {
    label: "Shortage Amount Through Cheque Once",
    leafLabels: ["Amount", "Date", "Cheque No", "Bank Name"],
    leafIds: [
      "shortageChequeAmount",
      "shortageDate",
      "shortageChequeNo",
      "shortageBankName",
    ],
  },
  { label: "ATL", leafLabels: ["ATL Govt Fee"], leafIds: ["atlTotal"] },
  { label: "POA/GPA", leafLabels: ["GPA/POA GOVT fee"], leafIds: ["paoTotal"] },
  {
    label: "NA",
    leafLabels: ["land conversion", "Podi fee"],
    leafIds: ["landConversion", "podiFee"],
  },
  { label: "Lease Deed", leafLabels: ["Govt fee"], leafIds: ["leaseDeedGovtFee"] },
  {
    label: "Debit Note",
    leafLabels: ["DB NO", "Amount"],
    leafIds: ["debitNoteNo", "debitNoteAmount"],
  },
  { label: "Remark", leafLabels: ["Remark"], leafIds: ["remark"] },
  { label: "Other charger", leafLabels: ["Other charger"], leafIds: ["otherCharges"] },
  {
    label: "Crop Compensations",
    leafLabels: ["Crop Compensations"],
    leafIds: ["cropCompensation"],
  },
];

const MONEY_IDS = new Set<string>([
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "rentAmount",
  "aesAdvanceChequeAmount",
  "balanceRentAmount",
  "loanAmount",
  "leaseAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "atlTotal",
  "paoTotal",
  "landConversion",
  "podiFee",
  "leaseDeedGovtFee",
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

const DATE_IDS = new Set([
  "aesAdvanceDate",
  "bankLoanDdDate",
  "rentalDdDate",
  "shortageDate",
]);

/** Leaf column ids rendered as right-aligned currency / numeric amounts in the table. */
export const MONEY_COLUMN_IDS = MONEY_IDS;

export function getExportCellValue(row: CustomerListRow, id: LeafColumnId): string | number {
  if (id === "remark") {
    const t = cellText(row.notes);
    return t === "—" ? "" : t;
  }
  if (id === "leaseDeedGovtFee") {
    const v = computeLeaseDeedGovtFee(row);
    if (v == null || Number.isNaN(v)) return "";
    return v;
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
      id: FARMER_DETAILS_GROUP_ID,
      header: "Farmer Details",
      columns: [
        {
          id: "farmerName",
          accessorKey: "farmerName",
          header: "Farmer Name",
          cell: ({ getValue }) => {
            const value = cellText(getValue() as string);
            return (
              <span
                className="block whitespace-normal break-words leading-[1.4] font-medium"
                title={value}
              >
                {value}
              </span>
            );
          },
          size: 160,
          minSize: 160,
          maxSize: 160,
          enablePinning: true,
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
          enablePinning: true,
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
          enablePinning: true,
        },
      ],
    },
    {
      id: SURVEY_FIELDS_GROUP_ID,
      header: "",
      columns: [
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
      ],
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
          size: 100,
          minSize: 96,
        },
        {
          id: "rtcExtentGunta",
          accessorKey: "rtcExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
        {
          id: "rtcAKharab",
          accessorKey: "rtcAKharab",
          header: "A Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 104,
          minSize: 96,
        },
        {
          id: "rtcBKharab",
          accessorKey: "rtcBKharab",
          header: "B Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 104,
          minSize: 96,
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
          size: 100,
          minSize: 96,
        },
        {
          id: "balanceExtentGunta",
          accessorKey: "balanceExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
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
          size: 100,
          minSize: 96,
        },
        {
          id: "leaseExtentGunta",
          accessorKey: "leaseExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
      ],
    },
    columnGroup("totalGuntaGroup", "Total Gunta", {
      id: "totalGunta",
      accessorKey: "totalGunta",
      header: "Total Gunta",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("totalCentsGroup", "Total Cents", {
      id: "totalCents",
      accessorKey: "totalCents",
      header: "Total Cents",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("rentPerAcreGroup", "Rent Per Acre", {
      id: "rentPerAcre",
      accessorKey: "rentPerAcre",
      header: "Rent Per Acre",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("rentAmountGroup", "Total Rent", {
      id: "rentAmount",
      accessorKey: "rentAmount",
      header: "Total Rent",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    {
      id: "aesAdvance",
      header: "AES Advance Per Acre",
      columns: [
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
          header: "Cheque no",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "aesAdvanceChequeAmount",
          accessorKey: "aesAdvanceChequeAmount",
          header: "cheque amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "aesAdvanceBankName",
          accessorKey: "aesAdvanceBankName",
          header: "Bank name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    columnGroup("balanceRentAmountGroup", "Balance Rent Amount", {
      id: "balanceRentAmount",
      accessorKey: "balanceRentAmount",
      header: "Balance Rent Amount",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 120,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup("tdsAmountGroup", "TDS Amount", {
      id: "tdsAmount",
      accessorKey: "tdsAmount",
      header: "TDS Amount",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    {
      id: "bankLoanDd",
      header: "Bank Loan DD From Company",
      columns: [
        {
          id: "bankLoanDdDate",
          accessorKey: "bankLoanDdDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "loanAmount",
          accessorKey: "loanAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "bankLoanDdNo",
          accessorKey: "bankLoanDdNo",
          header: "DD no",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "bankLoanBankName",
          accessorKey: "bankLoanBankName",
          header: "Bank name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "rentalDd",
      header: "Rental DD From Company",
      columns: [
        {
          id: "rentalDdDate",
          accessorKey: "rentalDdDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "leaseAmount",
          accessorKey: "leaseAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "rentalDdChequeNo",
          accessorKey: "rentalDdChequeNo",
          header: "Cheque no",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "rentalDdBankName",
          accessorKey: "rentalDdBankName",
          header: "Bank name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "shortageOnce",
      header: "Shortage Amount Through Cheque Once",
      columns: [
        {
          id: "shortageChequeAmount",
          accessorKey: "shortageChequeAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
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
    columnGroup("atl", "ATL", {
      id: "atlTotal",
      accessorKey: "atlTotal",
      header: "ATL Govt Fee",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 112,
      minSize: 104,
    }, { subHeader: "ATL Govt Fee" }),
    columnGroup("pao", "POA/GPA", {
      id: "paoTotal",
      accessorKey: "paoTotal",
      header: "GPA/POA GOVT fee",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 120,
      minSize: 104,
    }, { subHeader: "GPA/POA GOVT fee" }),
    {
      id: "na",
      header: "NA",
      columns: [
        {
          id: "landConversion",
          accessorKey: "landConversion",
          header: "land conversion",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "podiFee",
          accessorKey: "podiFee",
          header: "Podi fee",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 104,
          minSize: 96,
        },
      ],
    },
    columnGroup("leaseDeed", "Lease Deed", {
      id: "leaseDeedGovtFee",
      header: "Govt fee",
      cell: ({ row }) => moneyCell(computeLeaseDeedGovtFee(row.original)),
      size: 104,
      minSize: 96,
    }, { subHeader: "Govt fee" }),
    {
      id: "debitNote",
      header: "Debit Note",
      columns: [
        {
          id: "debitNoteNo",
          accessorKey: "debitNoteNo",
          header: "DB NO",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 85,
        },
        {
          id: "debitNoteAmount",
          accessorKey: "debitNoteAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
      ],
    },
    columnGroup("remarkGroup", "Remark", {
      id: "remark",
      accessorKey: "notes",
      header: "Remark",
      cell: ({ getValue }) => remarkCell(getValue() as string),
      size: 140,
      minSize: 120,
      maxSize: 200,
    }, { subHeader: null }),
    columnGroup("otherChargesGroup", "Other charger", {
      id: "otherCharges",
      accessorKey: "otherCharges",
      header: "Other charger",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 112,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup("cropCompensationGroup", "Crop Compensations", {
      id: "cropCompensation",
      accessorKey: "cropCompensation",
      header: "Crop Compensations",
      cell: ({ getValue }) => integerMoneyCell(getValue() as number),
      size: 120,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup(ACTIONS_GROUP_ID, "Actions", actionsColumn, { subHeader: null }),
  ];
}
