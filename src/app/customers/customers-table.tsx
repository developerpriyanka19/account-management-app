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
  PINNED_LEFT,
  PINNED_RIGHT,
  buildCustomerTableColumns,
} from "@/lib/customer-table-columns";
import { cn } from "@/lib/utils";
import { DeleteCustomerButton } from "./[id]/delete-customer-button";

const Z_HEADER_SCROLL = 20;
const Z_HEADER_PINNED = 40;
const Z_BODY_PINNED = 30;

const GROUP_TH =
  "border border-[#D1D5DB] px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#111827] bg-[#EEF2FF] whitespace-nowrap align-middle";
const LEAF_TH =
  "border border-[#D1D5DB] px-2 py-1 text-center text-[10px] font-semibold text-[#111827] bg-[#F8FAFC] whitespace-nowrap align-middle";
const TD =
  "border border-[#D1D5DB] px-2 py-1 text-xs text-[#111827] align-middle whitespace-nowrap h-8";

const HEADER_BG = "#F8FAFC";
const GROUP_BG = "#EEF2FF";
const BODY_BG = "#FFFFFF";
const ZEBRA_BG = "#FAFBFC";
const HOVER_BG = "#F9FAFB";

function getCellBackground(isZebra: boolean): string {
  return isZebra ? ZEBRA_BG : BODY_BG;
}

function getPinningStyles(
  column: Column<CustomerListRow, unknown>,
  opts: { isHeader: boolean; headerDepth?: number; backgroundColor: string },
): CSSProperties {
  const pinned = column.getIsPinned();
  const headerTop =
    opts.isHeader && opts.headerDepth != null ? opts.headerDepth * HEADER_ROW_H : opts.isHeader ? 0 : undefined;

  if (!pinned) {
    if (opts.isHeader) {
      return {
        position: "sticky",
        top: headerTop,
        zIndex: Z_HEADER_SCROLL,
        backgroundColor: opts.backgroundColor,
      };
    }
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
    top: headerTop,
    zIndex: opts.isHeader ? Z_HEADER_PINNED : Z_BODY_PINNED,
    backgroundColor: opts.backgroundColor,
    boxShadow,
  };
}

type Props = {
  customers: CustomerListRow[];
  nameFilter: string;
};

export function CustomersTable({ customers, nameFilter }: Props) {
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
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Link
              href={`/customers/${c.id}`}
              className="inline-flex h-6 items-center rounded px-2 text-[11px] font-medium text-[#2563EB] transition hover:bg-[#EFF6FF]"
            >
              View
            </Link>
            <Link
              href={`/customers/${c.id}/edit`}
              className="inline-flex h-6 items-center rounded px-2 text-[11px] font-medium text-[#111827] transition hover:bg-[#F3F4F6]"
            >
              Edit
            </Link>
            <DeleteCustomerButton
              customerId={c.id}
              label={deleteLabel}
              className="!h-6 !rounded !border-transparent !bg-transparent !px-2 !text-[11px] !text-[#DC2626] hover:!bg-red-50"
            />
          </div>
        );
      },
      size: 168,
      minSize: 168,
      maxSize: 168,
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
      <div className="max-h-[min(68vh,40rem)] overflow-auto scroll-smooth">
        <table className="table-auto w-max min-w-full border-collapse border-[#D1D5DB] text-left">
          <thead className="shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
            {headerGroups.map((hg, depth) => (
              <tr key={hg.id} className="h-7" style={{ height: HEADER_ROW_H }}>
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
                        header.column.id === "actions" && "text-center",
                        pinned && "border-[#D1D5DB]",
                      )}
                      style={{
                        ...getPinningStyles(header.column, {
                          isHeader: true,
                          headerDepth: depth,
                          backgroundColor: isGroupRow && header.colSpan > 1 ? GROUP_BG : HEADER_BG,
                        }),
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                  No customers match the current filters.
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
                    className="group h-8 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/30"
                    onClick={() => router.push(`/customers/${row.original.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/customers/${row.original.id}`);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          TD,
                          "group-hover:!bg-[#F9FAFB]",
                          cell.column.id === "actions" && "text-right",
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
