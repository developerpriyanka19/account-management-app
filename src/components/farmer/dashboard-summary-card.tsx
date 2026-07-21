import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  HandCoins,
  IndianRupee,
  Landmark,
  LandPlot,
  MapPin,
  ScrollText,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  formatDashboardCount,
  formatDashboardCurrency,
  formatDashboardCurrencyCompact,
} from "@/lib/dashboard-format";
import type { FarmerDashboardStats } from "@/lib/farmer-dashboard-stats";
import { cn } from "@/lib/utils";

const CARD_BASE =
  "dashboard-card group relative flex h-full flex-col rounded-xl border border-slate-100 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

type KpiCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  value: string;
  title: string;
  subtitle?: string;
  className?: string;
};

function KpiCard({
  icon: Icon,
  iconClassName,
  value,
  title,
  subtitle,
  className,
}: KpiCardProps) {
  return (
    <article className={cn(CARD_BASE, className)}>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <p
        className="dashboard-card-value mt-2 text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl"
        aria-label={`${title}: ${value}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium leading-snug text-slate-600">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{subtitle}</p> : null}
    </article>
  );
}

type NaBreakdownRow = {
  icon: LucideIcon;
  label: string;
  value: number;
};

function NaBreakdownCard({
  stats,
  className,
}: {
  stats: Pick<FarmerDashboardStats, "landConversion" | "otherRecoveries" | "podiFee" | "naTotal">;
  className?: string;
}) {
  const rows: NaBreakdownRow[] = [
    { icon: LandPlot, label: "Land Conversion", value: stats.landConversion },
    { icon: FileText, label: "Other Recoveries", value: stats.otherRecoveries },
    { icon: MapPin, label: "Podi Fee", value: stats.podiFee },
  ];

  return (
    <article className={cn(CARD_BASE, "hover:translate-y-0", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <TrendingUp className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-900">NA Breakdown</h2>
          <p className="text-[11px] text-slate-400">Non-agricultural fee components</p>
        </div>
      </div>
      <div className="mt-3 space-y-0">
        {rows.map((row, index) => {
          const Icon = row.icon;
          const isSmall = Math.abs(row.value) < 100_000;
          return (
            <div key={row.label}>
              {index > 0 ? <hr className="border-slate-100" /> : null}
              <div className="flex items-center justify-between gap-3 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-xs text-slate-600">{row.label}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-900">
                  {isSmall
                    ? formatDashboardCurrency(row.value)
                    : formatDashboardCurrencyCompact(row.value)}
                </span>
              </div>
            </div>
          );
        })}
        <hr className="border-slate-200" />
        <div className="flex items-center justify-between gap-3 pt-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">Total</span>
          <span className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">
            {formatDashboardCurrencyCompact(stats.naTotal)}
          </span>
        </div>
      </div>
    </article>
  );
}

type DashboardSummaryGridProps = {
  stats: FarmerDashboardStats;
};

export function DashboardSummaryGrid({ stats }: DashboardSummaryGridProps) {
  const farmersSubtitle =
    stats.farmersAddedThisMonth > 0
      ? `+${formatDashboardCount(stats.farmersAddedThisMonth)} this month`
      : "Registered farmers";

  return (
    <section className="dashboard-summary-grid grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-rows-2">
      <KpiCard
        icon={Users}
        iconClassName="bg-blue-50 text-blue-600"
        value={formatDashboardCount(stats.totalFarmers)}
        title="Farmer"
        subtitle={farmersSubtitle}
        className="h-full lg:col-start-1 lg:row-start-1"
      />
      <KpiCard
        icon={Wallet}
        iconClassName="bg-amber-50 text-amber-600"
        value={formatDashboardCurrencyCompact(stats.totalAesPaid)}
        title="AES Total Paid"
        subtitle="Advance + shortage cheques"
        className="h-full lg:col-start-2 lg:row-start-1"
      />
      <KpiCard
        icon={IndianRupee}
        iconClassName="bg-emerald-50 text-emerald-600"
        value={formatDashboardCurrencyCompact(stats.totalRentDdFromCompany)}
        title="Total Rental from DD Company"
        subtitle="Rental DD 1 + Rental DD 2"
        className="h-full lg:col-start-3 lg:row-start-1"
      />
      <KpiCard
        icon={Landmark}
        iconClassName="bg-blue-50 text-blue-600"
        value={formatDashboardCurrencyCompact(stats.totalLoanDdFromCompany)}
        title="Total Loan from DD Company"
        subtitle="Bank Loan DD Amount"
        className="h-full lg:col-start-4 lg:row-start-1"
      />
      <KpiCard
        icon={HandCoins}
        iconClassName="bg-violet-50 text-violet-600"
        value={formatDashboardCurrencyCompact(stats.totalPaidToFarmer)}
        title="Total Paid to Farmer"
        subtitle="Sum across all farmers"
        className="h-full lg:col-start-5 lg:row-start-1"
      />

      <KpiCard
        icon={Wallet}
        iconClassName="bg-blue-50 text-blue-600"
        value={formatDashboardCurrencyCompact(stats.atlTotal)}
        title="ATL Amount"
        subtitle="Agreement to Lease"
        className="h-full lg:col-start-1 lg:row-start-2"
      />
      <KpiCard
        icon={FileText}
        iconClassName="bg-emerald-50 text-emerald-600"
        value={formatDashboardCurrencyCompact(stats.gpaPoaTotal)}
        title="GPA / POA Total"
        subtitle="Power of Attorney fees"
        className="h-full lg:col-start-2 lg:row-start-2"
      />
      <KpiCard
        icon={IndianRupee}
        iconClassName="bg-orange-50 text-orange-600"
        value={formatDashboardCurrencyCompact(stats.naTotal)}
        title="NA Total"
        subtitle="All NA components"
        className="h-full lg:col-start-3 lg:row-start-2"
      />
      <KpiCard
        icon={ScrollText}
        iconClassName="bg-slate-50 text-slate-600"
        value={formatDashboardCurrencyCompact(stats.leaseDeedK2Challan)}
        title="Lease Deed K2 Challan"
        subtitle="Stamp duty + reg charges"
        className="h-full lg:col-start-4 lg:row-start-2"
      />
      <KpiCard
        icon={Building2}
        iconClassName="bg-emerald-50 text-emerald-600"
        value={formatDashboardCurrencyCompact(stats.totalGovtFee)}
        title="Total Govt Fee"
        subtitle="Overall collected"
        className="h-full lg:col-start-5 lg:row-start-2"
      />

      <NaBreakdownCard
        stats={stats}
        className="col-span-2 h-full sm:col-span-3 lg:col-span-1 lg:col-start-6 lg:row-start-1 lg:row-span-2"
      />
    </section>
  );
}

// Keep export for backwards compatibility if used elsewhere
export function DashboardSummaryCard({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <article className={cn(CARD_BASE, className)}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="dashboard-card-value mt-2 text-lg font-bold tabular-nums text-slate-900">
        {value}
      </p>
    </article>
  );
}

export function DashboardNaTotalCard({
  stats,
  className,
}: {
  stats: Pick<FarmerDashboardStats, "landConversion" | "otherRecoveries" | "podiFee" | "naTotal">;
  className?: string;
}) {
  return <NaBreakdownCard stats={stats} className={className} />;
}
