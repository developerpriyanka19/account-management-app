"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "default" | "sidebar";
  label?: string;
  icon?: ReactNode;
  className?: string;
};

export function LogoutButton({
  variant = "default",
  label = "Log out",
  icon,
  className,
}: Props) {
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/login");
    }
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
          "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {icon}
        {pending ? "Signing out…" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className={cn(
        "rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] transition hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending ? "Signing out…" : label}
    </button>
  );
}
