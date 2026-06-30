"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnPinningState,
} from "@tanstack/react-table";
import type { CSSProperties } from "react";
import { cellText, type CustomerListRow } from "@/lib/customer-list-format";
import {
  ACTIONS_COLUMN_ID,
  ACTIONS_COLUMN_WIDTH,
  ACTIONS_GROUP_ID,
  FARMER_DETAILS_GROUP_ID,
  HEADER_ROW_H,
  MONEY_COLUMN_IDS,
  PINNED_LEFT,
  PINNED_RIGHT,
  buildCustomerTableColumns,
  farmerDetailsGroupWidth,
  tableTotalWidth,
} from "@/lib/customer-table-columns";
import { cn } from "@/lib/utils";
import { DeleteFarmerButton } from "@/components/farmer/delete-farmer-button";

/** FARMER DETAILS parent header (sticky top + left, highest). */
const Z_PARENT_HEADER = 55;
/** Frozen-column sub-header (sticky top + left). */
const Z_HEADER_PINNED = 50;
/** Non-frozen header (sticky top only). */
const Z_HEADER = 35;
/** Empty sub-header placeholders (must stay below pinned header cells). */
const Z_SUPPRESSED_SUBHEADER = 1;
/** Frozen-column body (sticky left only). */
const Z_BODY_PINNED = 20;

const HEADER_TH_BASE =
  "border-b border-slate-200 px-[10px] py-[6px] text-center align-middle whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.2] overflow-visible";
const GROUP_TH =
  `${HEADER_TH_BASE} text-[11px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-50/90`;
const LEAF_TH =
  `${HEADER_TH_BASE} text-[12px] font-semibold text-slate-700 bg-slate-50/90`;
const TD_BASE =
  "border-b border-slate-100 px-[10px] py-[8px] text-[13px] text-slate-800 align-middle min-h-[44px] h-auto";
const TD =
  `${TD_BASE} overflow-hidden max-w-0`;
const TD_AMOUNT =
  `${TD_BASE} amount-cell-td overflow-visible max-w-none whitespace-normal`;

const HEADER_BG = "rgba(248, 250, 252, 0.95)";
const GROUP_BG = "rgba(248, 250, 252, 0.95)";
const BODY_BG = "#FFFFFF";
const ZEBRA_BG = "#F8FAFC";
const LEFT_ALIGN_HEADER_IDS = new Set([
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
  "remark",
]);
const WRAP_TEXT_COLUMN_IDS = new Set(["farmerName", "changedFarmerName", "remark"]);
function getCellBackground(isZebra: boolean): string {
  return isZebra ? ZEBRA_BG : BODY_BG;
}

/** Use columnDef sizes only — TanStack getSize() differs between SSR and client. */
function columnWidthPx(column: Column<CustomerListRow, unknown>): number {
  return column.columnDef.size ?? 100;
}

function getStableColumnStyle(column: Column<CustomerListRow, unknown>): CSSProperties {
  const def = column.columnDef;
  const width = def.size;
  if (width == null) return {};

  const style: CSSProperties = {
    width: `${width}px`,
    minWidth: `${def.minSize ?? width}px`,
  };
  if (def.maxSize != null) {
    style.maxWidth = `${def.maxSize}px`;
  }
  return style;
}

function getLeftPinnedOffset(
  column: Column<CustomerListRow, unknown>,
  leftPinned: Column<CustomerListRow, unknown>[],
): number | undefined {
  let offset = 0;
  for (const col of leftPinned) {
    if (col.id === column.id) return offset;
    offset += columnWidthPx(col);
  }
  return undefined;
}

function getRightPinnedOffset(
  column: Column<CustomerListRow, unknown>,
  rightPinned: Column<CustomerListRow, unknown>[],
): number | undefined {
  let offset = 0;
  for (let i = rightPinned.length - 1; i >= 0; i--) {
    const col = rightPinned[i]!;
    if (col.id === column.id) return offset;
    offset += columnWidthPx(col);
  }
  return undefined;
}

/** Header cells: sticky top for all; sticky left + higher z-index for frozen columns. */
function getHeaderCellStyles(
  column: Column<CustomerListRow, unknown>,
  leafColumns: Column<CustomerListRow, unknown>[],
  opts: {
    depth: number;
    headerRowCount: number;
    backgroundColor: string;
  },
): CSSProperties {
  const isFarmerDetailsParent =
    opts.depth === 0 && column.id === FARMER_DETAILS_GROUP_ID;
  const isActionsParent =
    opts.depth === 0 && column.id === ACTIONS_GROUP_ID;
  const meta = column.columnDef.meta as { suppressSubHeader?: boolean } | undefined;
  const isSuppressedSubHeader =
    opts.depth === 1 && meta?.suppressSubHeader === true;
  const pinned = column.getIsPinned();
  const topPx = opts.headerRowCount === 1 ? 0 : opts.depth * HEADER_ROW_H;

  const style: CSSProperties = {
    position: "sticky",
    top: `${topPx}px`,
    zIndex: isFarmerDetailsParent || isActionsParent
      ? Z_PARENT_HEADER
      : pinned
        ? Z_HEADER_PINNED
        : isSuppressedSubHeader
          ? Z_SUPPRESSED_SUBHEADER
          : Z_HEADER,
    backgroundColor: opts.backgroundColor,
    backgroundClip: "padding-box",
    boxSizing: "border-box",
    verticalAlign: "middle",
    overflow: "hidden",
    height: `${HEADER_ROW_H}px`,
    maxHeight: `${HEADER_ROW_H}px`,
  };

  if (isFarmerDetailsParent) {
    const groupWidth = farmerDetailsGroupWidth(leafColumns);
    return {
      ...style,
      left: "0px",
      width: `${groupWidth}px`,
      minWidth: `${groupWidth}px`,
      maxWidth: `${groupWidth}px`,
      boxShadow: "4px 0 8px -2px rgba(15,23,42,0.12)",
    };
  }

  if (isActionsParent) {
    return {
      ...style,
      right: "0px",
      width: `${ACTIONS_COLUMN_WIDTH}px`,
      minWidth: `${ACTIONS_COLUMN_WIDTH}px`,
      maxWidth: `${ACTIONS_COLUMN_WIDTH}px`,
      boxShadow: "-4px 0 8px -2px rgba(15,23,42,0.12)",
    };
  }

  if (isSuppressedSubHeader) {
    const rightPx =
      column.id === ACTIONS_COLUMN_ID
        ? getRightPinnedOffset(
            column,
            leafColumns.filter((c) => c.getIsPinned() === "right"),
          )
        : undefined;
    return {
      ...style,
      zIndex:
        column.id === ACTIONS_COLUMN_ID ? Z_HEADER_PINNED : Z_SUPPRESSED_SUBHEADER,
      right: rightPx != null ? `${rightPx}px` : undefined,
      width:
        column.id === ACTIONS_COLUMN_ID ? `${ACTIONS_COLUMN_WIDTH}px` : undefined,
      minWidth:
        column.id === ACTIONS_COLUMN_ID ? `${ACTIONS_COLUMN_WIDTH}px` : undefined,
      maxWidth:
        column.id === ACTIONS_COLUMN_ID ? `${ACTIONS_COLUMN_WIDTH}px` : undefined,
      padding: 0,
      lineHeight: 0,
      fontSize: 0,
      color: "transparent",
      ...(column.id === ACTIONS_COLUMN_ID
        ? { boxShadow: "-4px 0 8px -2px rgba(15,23,42,0.12)" }
        : {}),
    };
  }

  if (!pinned) {
    return style;
  }

  const leftPinned = leafColumns.filter((c) => c.getIsPinned() === "left");
  const rightPinned = leafColumns.filter((c) => c.getIsPinned() === "right");
  const leftPx = pinned === "left" ? getLeftPinnedOffset(column, leftPinned) : undefined;
  const rightPx = pinned === "right" ? getRightPinnedOffset(column, rightPinned) : undefined;

  const isLastLeft = pinned === "left" && column.id === leftPinned[leftPinned.length - 1]?.id;
  const isFirstRight = pinned === "right" && column.id === rightPinned[0]?.id;

  if (isLastLeft) style.boxShadow = "4px 0 8px -2px rgba(15,23,42,0.12)";
  if (isFirstRight) style.boxShadow = "-4px 0 8px -2px rgba(15,23,42,0.12)";

  const pinnedStyle: CSSProperties = {
    ...style,
    left: leftPx != null ? `${leftPx}px` : undefined,
    right: rightPx != null ? `${rightPx}px` : undefined,
    backgroundColor: opts.backgroundColor,
  };

  if (column.id === ACTIONS_COLUMN_ID) {
    return {
      ...pinnedStyle,
      width: `${ACTIONS_COLUMN_WIDTH}px`,
      minWidth: `${ACTIONS_COLUMN_WIDTH}px`,
      maxWidth: `${ACTIONS_COLUMN_WIDTH}px`,
    };
  }

  return pinnedStyle;
}

/** Body cells: sticky left only for frozen columns (scroll vertically with rows). */
function getBodyCellStyles(
  column: Column<CustomerListRow, unknown>,
  leafColumns: Column<CustomerListRow, unknown>[],
  backgroundColor: string,
): CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) {
    return {};
  }

  const leftPinned = leafColumns.filter((c) => c.getIsPinned() === "left");
  const rightPinned = leafColumns.filter((c) => c.getIsPinned() === "right");
  const leftPx = pinned === "left" ? getLeftPinnedOffset(column, leftPinned) : undefined;
  const rightPx = pinned === "right" ? getRightPinnedOffset(column, rightPinned) : undefined;

  const isLastLeft = pinned === "left" && column.id === leftPinned[leftPinned.length - 1]?.id;
  const isFirstRight = pinned === "right" && column.id === rightPinned[0]?.id;

  let boxShadow: string | undefined;
  if (isLastLeft) boxShadow = "4px 0 8px -2px rgba(15,23,42,0.12)";
  if (isFirstRight) boxShadow = "-4px 0 8px -2px rgba(15,23,42,0.12)";

  return {
    position: "sticky",
    left: leftPx != null ? `${leftPx}px` : undefined,
    right: rightPx != null ? `${rightPx}px` : undefined,
    zIndex: Z_BODY_PINNED,
    backgroundColor,
    backgroundClip: "padding-box",
    boxShadow,
  };
}

type Props = {
  customers: CustomerListRow[];
  nameFilter: string;
};

export function FarmerTable({ customers, nameFilter }: Props) {
  const router = useRouter();

  const actionsColumn: ColumnDef<CustomerListRow> = useMemo(
    () => ({
      id: ACTIONS_COLUMN_ID,
      header: "Actions",
      cell: ({ row }) => {
        const c = row.original;
        const label = cellText(c.farmerName);
        const deleteLabel = label === "—" ? `Farmer #${c.id}` : label;
        return (
          <div
            className="flex items-center justify-center gap-1.5 px-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Link
              href={`/farmer/${c.id}`}
              className="inline-flex h-7 items-center rounded px-[6px] text-[12px] font-medium text-[#2563EB] transition hover:bg-[#EFF6FF]"
            >
              View
            </Link>
            <Link
              href={`/farmer/${c.id}/edit`}
              className="inline-flex h-7 items-center rounded px-[6px] text-[12px] font-medium text-[#111827] transition hover:bg-[#F3F4F6]"
            >
              Edit
            </Link>
            <DeleteFarmerButton
              farmerId={c.id}
              label={deleteLabel}
              className="!h-7 !rounded !border-transparent !bg-transparent !px-[6px] !text-[12px] !text-[#DC2626] hover:!bg-red-50"
            />
          </div>
        );
      },
      size: ACTIONS_COLUMN_WIDTH,
      minSize: ACTIONS_COLUMN_WIDTH,
      maxSize: ACTIONS_COLUMN_WIDTH,
      enablePinning: true,
    }),
    [],
  );

  const columns = useMemo(() => buildCustomerTableColumns(actionsColumn), [actionsColumn]);

  const [columnPinning] = useState<ColumnPinningState>({
    left: [...PINNED_LEFT],
    right: [...PINNED_RIGHT],
  });

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      columnPinning,
      globalFilter: nameFilter,
    },
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!q) return true;
      const name = row.original.farmerName?.trim().toLowerCase() ?? "";
      return name.includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnPinning: true,
  });

  const headerGroups = table.getHeaderGroups();
  const headerRowCount = headerGroups.length;
  const leafColumns = table.getAllLeafColumns();
  const leafCount = leafColumns.length;
  const totalTableWidth = tableTotalWidth(leafColumns);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/70 shadow-sm backdrop-blur-sm">
      <div className="max-h-[min(72vh,46rem)] overflow-auto scroll-smooth">
        <table
          className="table-fixed border-separate border-spacing-0 text-left text-[13px]"
          style={{ width: `${totalTableWidth}px`, minWidth: `${totalTableWidth}px` }}
        >
          <colgroup>
            {leafColumns.map((col) => (
              <col key={col.id} style={{ width: `${columnWidthPx(col)}px` }} />
            ))}
          </colgroup>
          <thead>
            {headerGroups.map((hg, depth) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  if (header.isPlaceholder) {
                    return null;
                  }

                  const pinned = header.column.getIsPinned();
                  const isGroupRow = depth === 0 && headerRowCount > 1;
                  const isGroupParentHeader =
                    isGroupRow && header.subHeaders.length > 0;
                  const isActionsParentHeader =
                    depth === 0 && header.column.id === ACTIONS_GROUP_ID;
                  const columnMeta = header.column.columnDef.meta as
                    | { suppressSubHeader?: boolean }
                    | undefined;
                  const isSuppressedSubHeader =
                    depth === 1 && columnMeta?.suppressSubHeader === true;
                  const headerBg =
                    isGroupParentHeader ? GROUP_BG : HEADER_BG;
                  const isSubHeaderRow = headerRowCount > 1 && depth === 1;

                  const isFarmerDetailsParentHeader =
                    isGroupParentHeader && header.column.id === FARMER_DETAILS_GROUP_ID;
                  const farmerDetailsWidth = farmerDetailsGroupWidth(leafColumns);

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        (isGroupParentHeader) || isActionsParentHeader
                          ? GROUP_TH
                          : LEAF_TH,
                        isSubHeaderRow && "-mt-px border-t-0",
                        isSuppressedSubHeader && "p-0",
                        isActionsParentHeader && "text-center",
                        LEFT_ALIGN_HEADER_IDS.has(header.column.id) && "text-left pl-4",
                        MONEY_COLUMN_IDS.has(header.column.id) && "text-right",
                        pinned && "border-slate-200",
                      )}
                      style={{
                        ...getHeaderCellStyles(header.column, leafColumns, {
                          depth,
                          headerRowCount,
                          backgroundColor: headerBg,
                        }),
                        ...(isGroupParentHeader && !isFarmerDetailsParentHeader
                          ? {}
                          : getStableColumnStyle(header.column)),
                        ...(isFarmerDetailsParentHeader
                          ? {
                              width: `${farmerDetailsWidth}px`,
                              minWidth: `${farmerDetailsWidth}px`,
                              maxWidth: `${farmerDetailsWidth}px`,
                            }
                          : {}),
                        ...(header.column.id === ACTIONS_COLUMN_ID ||
                        header.column.id === ACTIONS_GROUP_ID
                          ? {
                              width: `${ACTIONS_COLUMN_WIDTH}px`,
                              minWidth: `${ACTIONS_COLUMN_WIDTH}px`,
                              maxWidth: `${ACTIONS_COLUMN_WIDTH}px`,
                            }
                          : {}),
                      }}
                    >
                      {header.isPlaceholder || isSuppressedSubHeader ? null : (
                        <span
                          className={cn(
                            "block whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.2]",
                            LEFT_ALIGN_HEADER_IDS.has(header.column.id)
                              ? "text-left"
                              : MONEY_COLUMN_IDS.has(header.column.id)
                                ? "text-right"
                                : "text-center",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={leafCount} className="border-b border-slate-100 px-3 py-10 text-center text-sm text-slate-500">
                  No farmers match the current filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => {
                const isZebra = index % 2 === 1;
                const rowBg = getCellBackground(isZebra);
                return (
                  <tr
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    className="group cursor-pointer transition-colors hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/30"
                    onClick={() => router.push(`/farmer/${row.original.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/farmer/${row.original.id}`);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isAmountCol = MONEY_COLUMN_IDS.has(cell.column.id);
                      return (
                      <td
                        key={cell.id}
                        className={cn(
                          isAmountCol ? TD_AMOUNT : TD,
                          "group-hover:!bg-blue-50/50",
                          !isAmountCol &&
                            (WRAP_TEXT_COLUMN_IDS.has(cell.column.id)
                              ? "whitespace-normal"
                              : "whitespace-nowrap"),
                          isAmountCol && "text-right",
                          LEFT_ALIGN_HEADER_IDS.has(cell.column.id) && "pl-4",
                          cell.column.id === ACTIONS_COLUMN_ID &&
                            "text-center !max-w-none",
                        )}
                        style={{
                          ...getBodyCellStyles(cell.column, leafColumns, rowBg),
                          ...getStableColumnStyle(cell.column),
                          ...(cell.column.id === ACTIONS_COLUMN_ID
                            ? {
                                width: `${ACTIONS_COLUMN_WIDTH}px`,
                                minWidth: `${ACTIONS_COLUMN_WIDTH}px`,
                                maxWidth: `${ACTIONS_COLUMN_WIDTH}px`,
                              }
                            : {}),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
