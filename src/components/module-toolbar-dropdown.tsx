"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { DocumentModuleGroup } from "@/lib/document-modules";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  group: DocumentModuleGroup;
};

export function ModuleToolbarDropdown({ group }: Props) {
  const pathname = usePathname();
  const Icon = group.icon;
  const activeItem = group.items.find((item) => item.href === pathname);
  const isGroupActive = Boolean(activeItem);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-[#D1D5DB] bg-white px-3 text-xs font-medium text-[#111827] shadow-none hover:bg-[#F9FAFB]",
            isGroupActive && "border-[#2563EB]/40 bg-[#EFF6FF] text-[#1D4ED8]",
          )}
          aria-label={`${group.menuLabel} menu`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {group.menuLabel}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{group.menuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "cursor-pointer",
                  isActive && "bg-[#EFF6FF] font-medium text-[#1D4ED8] focus:bg-[#EFF6FF] focus:text-[#1D4ED8]",
                )}
              >
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
