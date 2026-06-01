/**
 * Billing customer module (GstCustomer / `gst_customers` table).
 * Separate from farmer land records (`Customer` model on `/farmer`).
 */
import type { GstCustomer } from "@prisma/client";

export type GstCustomerRow = {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string | null;
  email: string | null;
  gstNumber: string;
  companyName: string | null;
  buildingNumber: string | null;
  street: string | null;
  locality: string | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  hobbli: string | null;
  pincode: string | null;
  companyAddress: string | null;
  state: string | null;
  gstStatus: string | null;
  panNumber: string | null;
  notes: string | null;
  createdAt: Date;
};

export const GST_CUSTOMERS_PAGE_SIZE = 10;

export function toGstCustomerRow(customer: GstCustomer): GstCustomerRow {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    mobile: customer.mobile,
    email: customer.email,
    gstNumber: customer.gstNumber,
    companyName: customer.companyName,
    buildingNumber: customer.buildingNumber,
    street: customer.street,
    locality: customer.locality,
    village: customer.village,
    taluk: customer.taluk,
    district: customer.district,
    hobbli: customer.hobbli,
    pincode: customer.pincode,
    companyAddress: customer.companyAddress,
    state: customer.state,
    gstStatus: customer.gstStatus,
    panNumber: customer.panNumber,
    notes: customer.notes,
    createdAt: customer.createdAt,
  };
}

export function gstCustomerDisplayName(row: GstCustomerRow): string {
  return row.companyName?.trim() || `${row.firstName} ${row.lastName}`.trim();
}

export function gstCustomerListWhere(query: string) {
  const q = query.trim();
  if (!q) return undefined;
  return {
    OR: [
      { firstName: { contains: q, mode: "insensitive" as const } },
      { lastName: { contains: q, mode: "insensitive" as const } },
      { gstNumber: { contains: q.toUpperCase(), mode: "insensitive" as const } },
      { companyName: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
      { mobile: { contains: q, mode: "insensitive" as const } },
      { district: { contains: q, mode: "insensitive" as const } },
    ],
  };
}
