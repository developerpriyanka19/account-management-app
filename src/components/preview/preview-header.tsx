"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
};

/** Shared preview toolbar: title left, close control right. */
export function PreviewHeader({
  title,
  onClose,
  closeLabel = "Close",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white pb-3",
        className,
      )}
    >
      <h2 className="min-w-0 text-sm font-semibold text-[#111827] sm:text-base">{title}</h2>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        className="shrink-0 gap-1.5"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">{closeLabel}</span>
      </Button>
    </div>
  );
}
