import type { Metadata } from "next";
import { CustomerForm } from "./customer-form";
import { CustomersContentCard, CustomersPageShell } from "../customers-page-shell";

export const metadata: Metadata = {
  title: "Add Farmer",
};

export default function NewCustomerPage() {
  return (
    <CustomersPageShell
      title="Add Farmer"
      subtitle="Enter farmer details below."
      backHref="/farmer"
      backLabel="Back to customers"
      maxWidth="form"
    >
      <CustomersContentCard>
        <CustomerForm />
      </CustomersContentCard>
    </CustomersPageShell>
  );
}
