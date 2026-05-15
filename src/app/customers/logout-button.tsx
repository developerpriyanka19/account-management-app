"use client";

import { useState } from "react";

export function LogoutButton() {
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

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] transition hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
