import {
  createDocumentModulePage,
  createDocumentModulePageMetadata,
} from "@/lib/create-document-module-page";
import { INVOICE_MODULE_ITEMS } from "@/lib/document-modules";

const item = INVOICE_MODULE_ITEMS[1]!;

export const metadata = createDocumentModulePageMetadata(item);
export default createDocumentModulePage({ item, groupLabel: "Invoice" });
