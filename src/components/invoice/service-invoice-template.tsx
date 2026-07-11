import { ServiceInvoiceDocument } from "./service-invoice-document";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

/** Service category invoice — common A4 layout with template-specific table. */
export function ServiceInvoiceTemplate({ data }: Props) {
  return <ServiceInvoiceDocument data={data} />;
}

