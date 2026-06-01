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
  HEADER_ROW_H,
  MONEY_COLUMN_IDS,
  PINNED_LEFT,
  PINNED_RIGHT,
  buildCustomerTableColumns,
} from "@/lib/customer-table-columns";
import { cn } from "@/lib/utils";
import { DeleteFarmerButton } from "@/components/farmer/delete-farmer-button";

const Z_HEADER_PINNED = 40;
const Z_BODY_PINNED = 30;

const HEADER_TH_BASE =
  "border border-[#D1D5DB] px-[10px] py-[6px] text-center align-middle whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.2] overflow-visible";
const GROUP_TH =
  `${HEADER_TH_BASE} text-[12px] font-semibold uppercase tracking-wide text-[#111827] bg-[#EEF2FF]`;
const LEAF_TH =
  `${HEADER_TH_BASE} py-[8px] text-[13px] font-semibold text-[#111827] bg-[#F8FAFC]`;
const TD =
  "border border-[#D1D5DB] px-[10px] py-[8px] text-[13px] text-[#111827] align-middle overflow-hidden min-h-[44px] max-w-0";

const HEADER_BG = "#F8FAFC";
const GROUP_BG = "#EEF2FF";
const BODY_BG = "#FFFFFF";
const ZEBRA_BG = "#FAFBFC";
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

function getPinningStyles(
  column: Column<CustomerListRow, unknown>,
  opts: { isHeader: boolean; backgroundColor: string },
): CSSProperties {
  const pinned = column.getIsPinned();

  if (!pinned) {
    return {};
  }

  const isLastLeft = pinned === "left" && column.getIsLastColumn("left");
  const isFirstRight = pinned === "right" && column.getIsFirstColumn("right");

  let boxShadow: string | undefined;
  if (isLastLeft) boxShadow = "4px 0 8px -2px rgba(15,23,42,0.1)";
  if (isFirstRight) boxShadow = "-4px 0 8px -2px rgba(15,23,42,0.1)";

  return {
    position: "sticky",
    left: pinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: pinned === "right" ? `${column.getAfter("right")}px` : undefined,
    top: opts.isHeader ? 0 : undefined,
    zIndex: opts.isHeader ? Z_HEADER_PINNED : Z_BODY_PINNED,
    backgroundColor: opts.backgroundColor,
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const c = row.original;
        const label = cellText(c.farmerName);
        const deleteLabel = label === "—" ? `Customer #${c.id}` : label;
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
      size: 160,
      minSize: 160,
      maxSize: 160,
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
  const leafCount = table.getAllLeafColumns().length;

  return (
    <div className="isolate overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
      <div className="max-h-[min(72vh,46rem)] overflow-auto scroll-smooth">
        <table className="table-fixed w-full min-w-full border-collapse border-[#D1D5DB] text-left text-[13px]">
          <thead className="sticky top-0 z-[25] shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
            {headerGroups.map((hg, depth) => (
              <tr key={hg.id} className="h-auto" style={{ minHeight: HEADER_ROW_H }}>
                {hg.headers.map((header) => {
                  const pinned = header.column.getIsPinned();
                  const isGroupRow = depth === 0 && headerGroups.length > 1;
                  const isLeafOnly = header.colSpan === 1 && !header.subHeaders.length;

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      rowSpan={
                        headerGroups.length > 1 && depth === 0 && isLeafOnly ? 2 : undefined
                      }
                      className={cn(
                        isGroupRow && header.colSpan > 1 ? GROUP_TH : LEAF_TH,
                        LEFT_ALIGN_HEADER_IDS.has(header.column.id) && "text-left pl-4",
                        MONEY_COLUMN_IDS.has(header.column.id) && "text-right",
                        header.column.id === "actions" && "text-center",
                        pinned && "border-[#D1D5DB]",
                      )}
                      style={{
                        ...getPinningStyles(header.column, {
                          isHeader: true,
                          backgroundColor: isGroupRow && header.colSpan > 1 ? GROUP_BG : HEADER_BG,
                        }),
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder ? null : (
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
                <td colSpan={leafCount} className="border border-[#D1D5DB] px-3 py-10 text-center text-sm text-[#6B7280]">
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
                    className="group cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/30"
                    onClick={() => router.push(`/farmer/${row.original.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/farmer/${row.original.id}`);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          TD,
                          "group-hover:!bg-[#F9FAFB]",
                          WRAP_TEXT_COLUMN_IDS.has(cell.column.id)
                            ? "whitespace-normal"
                            : "whitespace-nowrap",
                          MONEY_COLUMN_IDS.has(cell.column.id) && "text-right",
                          LEFT_ALIGN_HEADER_IDS.has(cell.column.id) && "pl-4",
                          cell.column.id === "actions" && "text-center !max-w-none",
                        )}
                        style={{
                          ...getPinningStyles(cell.column, {
                            isHeader: false,
                            backgroundColor: rowBg,
                          }),
                          width: cell.column.getSize(),
                          minWidth: cell.column.columnDef.minSize,
                          maxWidth: cell.column.columnDef.maxSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
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
