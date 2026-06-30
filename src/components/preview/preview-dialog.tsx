"use client";

import type { ReactNode } from "react";
import { PreviewHeader } from "@/components/preview/preview-header";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  closeLabel?: string;
  children: ReactNode;
  className?: string;
};

/** Modal preview with ESC, outside click, and consistent close header. */
export function PreviewDialog({
  open,
  onOpenChange,
  title = "Document Preview",
  closeLabel = "Close",
  children,
  className,
}: Props) {
  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "no-print w-[min(100%,220mm)] max-h-[92vh] gap-0 overflow-hidden p-4 sm:p-6",
          className,
        )}
        onEscapeKeyDown={close}
        onPointerDownOutside={close}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <PreviewHeader title={title} onClose={close} closeLabel={closeLabel} className="mb-3" />
        <div className="max-h-[calc(92vh-4.5rem)] overflow-x-hidden overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
