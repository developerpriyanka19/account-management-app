import { NaInvoiceDocument } from "./na-invoice-document";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

/** NA category invoice — A4 printable tax invoice layout. */
export function NaInvoiceTemplate({ data }: Props) {
  return <NaInvoiceDocument data={data} />;
}
