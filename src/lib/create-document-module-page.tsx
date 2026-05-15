import type { Metadata } from "next";
import { DocumentModulePage } from "@/components/document-module-page";
import type { DocumentModuleItem } from "@/lib/document-modules";

export function createDocumentModulePageMetadata(item: DocumentModuleItem): Metadata {
  return { title: item.pageTitle };
}

type CreatePageOptions = {
  item: DocumentModuleItem;
  groupLabel: string;
  groupHref?: string;
};

export function createDocumentModulePage({ item, groupLabel, groupHref }: CreatePageOptions) {
  return function DocumentModuleRoutePage() {
    return (
      <DocumentModulePage
        title={item.pageTitle}
        breadcrumbs={[
          { label: "Customers", href: "/customers" },
          { label: groupLabel, href: groupHref },
          { label: item.label },
        ]}
      />
    );
  };
}
