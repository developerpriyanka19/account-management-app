import {
  createDocumentModulePage,
  createDocumentModulePageMetadata,
} from "@/lib/create-document-module-page";
const item = {
  label: "NA",
  href: "/debit-note/na",
  pageTitle: "NA Debit Note",
};

export const metadata = createDocumentModulePageMetadata(item);
export default createDocumentModulePage({ item, groupLabel: "Debit Note" });
