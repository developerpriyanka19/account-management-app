"use client";

import { DOCUMENT_MODULE_GROUPS } from "@/lib/document-modules";
import { ModuleToolbarDropdown } from "@/components/module-toolbar-dropdown";

export function CustomersToolbarMenus() {
  return (
    <>
      {DOCUMENT_MODULE_GROUPS.map((group) => (
        <ModuleToolbarDropdown key={group.id} group={group} />
      ))}
    </>
  );
}
