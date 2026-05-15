"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  validateCustomerForm,
  type CustomerFormState,
} from "@/lib/customer-form-validation";
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

  revalidatePath("/customers");
  redirect("/customers");
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
    data: { ...result.data },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
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

export async function deleteCustomer(id: number) {
  if (!Number.isInteger(id) || id < 1) {
    redirect("/customers");
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    redirect("/customers");
  }

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/customers");
  redirect("/customers");
}
