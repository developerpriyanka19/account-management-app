"use client";

import Link from "next/link";
import type { GstCustomerRow } from "@/lib/gst-customer";
import { cn } from "@/lib/utils";
import { DeleteGstCustomerButton } from "./delete-gst-customer-button";

const TH =
  "border border-[#D1D5DB] px-3.5 py-2 text-left text-[13px] font-semibold text-[#111827] bg-[#F8FAFC] whitespace-nowrap sticky top-0 z-10";
const TD =
  "border border-[#D1D5DB] px-3.5 py-3 text-[14px] text-[#111827] align-middle whitespace-nowrap h-[52px]";

function cell(value: string | null | undefined) {
  const t = value?.trim();
  return t && t.length > 0 ? t : "—";
}

type Props = {
  customers: GstCustomerRow[];
};

export function CustomerTable({ customers }: Props) {
  return (
    <div className="isolate overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-sm">
      <div className="max-h-[min(68vh,40rem)] overflow-auto scroll-smooth">
        <table className="w-max min-w-full border-collapse text-left text-[14px]">
          <thead className="shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
            <tr>
              <th className={TH}>First Name</th>
              <th className={TH}>Last Name</th>
              <th className={TH}>GST Number</th>
              <th className={TH}>Company Name</th>
              <th className={TH}>District</th>
              <th className={TH}>PIN Code</th>
              <th className={TH}>State</th>
              <th className={TH}>GST Status</th>
              <th className={cn(TH, "text-center")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-[#D1D5DB] px-3 py-12 text-center text-sm text-[#6B7280]"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c, index) => {
                const isZebra = index % 2 === 1;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "group transition-colors",
                      isZebra ? "bg-[#FAFBFC]" : "bg-white",
                      "hover:bg-[#F9FAFB]",
                    )}
                  >
                    <td className={TD}>{cell(c.firstName)}</td>
                    <td className={TD}>{cell(c.lastName)}</td>
                    <td className={cn(TD, "font-mono text-[#2563EB]")}>{cell(c.gstNumber)}</td>
                    <td className={TD}>{cell(c.companyName)}</td>
                    <td className={TD}>{cell(c.district)}</td>
                    <td className={TD}>{cell(c.pincode)}</td>
                    <td className={TD}>{cell(c.state)}</td>
                    <td className={TD}>{cell(c.gstStatus)}</td>
                    <td className={cn(TD, "text-right")}>
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/customers-management/${c.id}`}
                          className="inline-flex h-7 items-center rounded px-2 text-[13px] font-medium text-[#2563EB] hover:bg-[#EFF6FF]"
                        >
                          View
                        </Link>
                        <Link
                          href={`/customers-management/${c.id}/edit`}
                          className="inline-flex h-7 items-center rounded px-2 text-[13px] font-medium text-[#111827] hover:bg-[#F3F4F6]"
                        >
                          Edit
                        </Link>
                        <DeleteGstCustomerButton
                          customerId={c.id}
                          label={`${c.firstName} ${c.lastName}`.trim() || c.gstNumber}
                        />
                      </div>
                    </td>
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
