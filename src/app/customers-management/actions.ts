"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/validators/customer";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import type { GstCustomer } from "@prisma/client";
import { normalizeGstNumber } from "@/lib/validators/gst";

const LIST_PATH = "/customers-management";

function formToDb(values: CustomerFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    mobile: values.mobile || null,
    email: values.email || null,
    gstNumber: values.gstNumber,
    companyName: values.companyName || null,
    buildingNumber: values.buildingNumber || null,
    street: values.street || null,
    locality: values.locality || null,
    village: values.village || null,
    district: values.district || null,
    pincode: values.pincode || null,
    companyAddress: values.companyAddress || null,
    state: values.state || null,
    gstStatus: values.gstStatus || null,
    panNumber: values.panNumber || null,
    notes: values.notes || null,
  };
}

async function assertGstUnique(gstNumber: string, excludeId?: number) {
  const existing = await gstCustomerDb().findUnique({ where: { gstNumber } });
  if (existing && existing.id !== excludeId) {
    return "Customer already exists with this GST number.";
  }
  return null;
}

export async function createGstCustomer(values: CustomerFormValues) {
  const validated = parseCustomerFormValues(values);
  if (!validated.ok) {
    return { ok: false as const, fieldErrors: validated.fieldErrors, message: validated.message };
  }

  const duplicate = await assertGstUnique(validated.data.gstNumber);
  if (duplicate) {
    return {
      ok: false as const,
      fieldErrors: { gstNumber: duplicate },
      message: duplicate,
    };
  }

  await gstCustomerDb().create({ data: formToDb(validated.data) });
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

export async function updateGstCustomer(id: number, values: CustomerFormValues) {
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false as const, message: "Invalid customer." };
  }

  const validated = parseCustomerFormValues(values);
  if (!validated.ok) {
    return { ok: false as const, fieldErrors: validated.fieldErrors, message: validated.message };
  }

  const existing = (await gstCustomerDb().findUnique({ where: { id } })) as GstCustomer | null;
  if (!existing) {
    return { ok: false as const, message: "Customer not found." };
  }

  const duplicate = await assertGstUnique(validated.data.gstNumber, id);
  if (duplicate) {
    return {
      ok: false as const,
      fieldErrors: { gstNumber: duplicate },
      message: duplicate,
    };
  }

  await gstCustomerDb().update({
    where: { id },
    data: formToDb(validated.data),
  });

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath(`${LIST_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteGstCustomer(id: number) {
  if (!Number.isInteger(id) || id < 1) {
    redirect(LIST_PATH);
  }

  const existing = await gstCustomerDb().findUnique({ where: { id } });
  if (!existing) {
    redirect(LIST_PATH);
  }

  await gstCustomerDb().delete({ where: { id } });
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function fetchGstCustomersForExport(searchQuery: string) {
  const q = searchQuery.trim();
  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { gstNumber: { contains: normalizeGstNumber(q), mode: "insensitive" as const } },
          { companyName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  return gstCustomerDb().findMany({
    where,
    orderBy: { id: "asc" },
  });
}
