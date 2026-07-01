import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold text-[#111827]">Reports</h1>
      </header>
      <div className="rounded-2xl border border-slate-100 bg-white/70 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
        <p className="text-sm text-slate-500">Reports module will be added here.</p>
      </div>
    </div>
  );
}
