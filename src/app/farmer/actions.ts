"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  validateCustomerForm,
  type CustomerFormState,
} from "@/lib/customer-form-validation";
import { PRESERVED_OFF_LAYOUT_DB_FIELDS } from "@/lib/customer-field-layout";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  CUSTOMER_LIST_SELECT,
  customerListWhere,
} from "@/lib/customer-list-query";

export type CreateCustomerState = CustomerFormState;
export type UpdateCustomerState = CustomerFormState;

export async function createCustomer(
  _prevState: CreateCustomerState,
  formData: FormData,
): Promise<CreateCustomerState> {
  const result = validateCustomerForm(formData);
  if (!result.ok) return result.state;

  await prisma.customer.create({
    data: { ...result.data },
  });

  revalidatePath("/farmer");
  redirect("/farmer");
}

export async function updateCustomer(
  _prevState: UpdateCustomerState,
  formData: FormData,
): Promise<UpdateCustomerState> {
  const id = Number(String(formData.get("customerId") ?? ""));
  if (!Number.isInteger(id) || id < 1) {
    return {
      fieldErrors: { farmerName: "Invalid customer." },
    };
  }

  const result = validateCustomerForm(formData);
  if (!result.ok) return result.state;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return {
      fieldErrors: { farmerName: "Customer not found." },
    };
  }

  await prisma.customer.update({
    where: { id },
    data: {
      ...result.data,
      ...Object.fromEntries(
        PRESERVED_OFF_LAYOUT_DB_FIELDS.map((key) => [key, existing[key as keyof typeof existing]]),
      ),
    },
  });

  revalidatePath("/farmer");
  revalidatePath(`/farmer/${id}`);
  redirect(`/farmer/${id}`);
}

export async function fetchCustomersForExport(
  searchQuery: string,
): Promise<CustomerListRow[]> {
  return prisma.customer.findMany({
    where: customerListWhere(searchQuery),
    orderBy: { id: "asc" },
    select: CUSTOMER_LIST_SELECT,
  });
}

export async function fetchAllFarmersForExport(): Promise<CustomerListRow[]> {
  return prisma.customer.findMany({
    orderBy: { id: "asc" },
    select: CUSTOMER_LIST_SELECT,
  });
}

export async function deleteCustomer(id: number) {
  if (!Number.isInteger(id) || id < 1) {
    redirect("/farmer");
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    redirect("/farmer");
  }

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/farmer");
  redirect("/farmer");
}
