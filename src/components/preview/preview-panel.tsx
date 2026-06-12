"use client";

import type { ReactNode } from "react";
import { PreviewHeader } from "@/components/preview/preview-header";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  closeLabel?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

/** Side-panel preview (e.g. invoice builder split layout). */
export function PreviewPanel({
  title = "Document Preview",
  closeLabel = "Close Preview",
  onClose,
  children,
  className,
}: Props) {
  return (
    <aside className="w-full shrink-0 lg:w-[min(100%,920px)] lg:max-w-[920px]">
      <div
        className={cn(
          "sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto overscroll-contain rounded-lg border border-[#D1D5DB] bg-[#F3F4F6] p-4 shadow-sm",
          className,
        )}
      >
        <PreviewHeader
          title={title}
          onClose={onClose}
          closeLabel={closeLabel}
          className="mb-3 bg-[#F3F4F6]"
        />
        {children}
      </div>
    </aside>
  );
}
