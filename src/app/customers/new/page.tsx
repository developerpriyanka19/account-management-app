import type { Metadata } from "next";
import { CustomerForm } from "./customer-form";
import { CustomersContentCard, CustomersPageShell } from "../customers-page-shell";

export const metadata: Metadata = {
  title: "Add Customer",
};

export default function NewCustomerPage() {
  return (
    <CustomersPageShell
      title="Add customer"
      subtitle="Enter customer details below."
      backHref="/customers"
      backLabel="Back to customers"
      maxWidth="form"
    >
      <CustomersContentCard>
        <CustomerForm />
      </CustomersContentCard>
    </CustomersPageShell>
  );
}
