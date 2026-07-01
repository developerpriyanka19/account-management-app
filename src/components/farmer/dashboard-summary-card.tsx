import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  FileText,
  IndianRupee,
  LandPlot,
  MapPin,
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
  "dashboard-card group relative flex flex-col rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

type KpiCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  value: string;
  title: string;
  subtitle?: string;
  progress?: number;
  className?: string;
};

function KpiCard({
  icon: Icon,
  iconClassName,
  value,
  title,
  subtitle,
  progress,
  className,
}: KpiCardProps) {
  const progressPct = progress != null ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <article className={cn(CARD_BASE, className)}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {progressPct != null ? (
          <span className="text-xs font-medium tabular-nums text-slate-400">
            {Math.round(progressPct)}%
          </span>
        ) : null}
      </div>
      <p
        className="dashboard-card-value mt-4 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl"
        aria-label={`${title}: ${value}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-600">{title}</p>
      {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      {progressPct != null ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">NA Breakdown</h2>
          <p className="text-xs text-slate-400">Non-agricultural fee components</p>
        </div>
      </div>
      <div className="mt-5 space-y-0">
        {rows.map((row, index) => {
          const Icon = row.icon;
          const isSmall = Math.abs(row.value) < 100_000;
          return (
            <div key={row.label}>
              {index > 0 ? <hr className="border-slate-100" /> : null}
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-sm text-slate-600">{row.label}</span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {isSmall
                    ? formatDashboardCurrency(row.value)
                    : formatDashboardCurrencyCompact(row.value)}
                </span>
              </div>
            </div>
          );
        })}
        <hr className="border-slate-200" />
        <div className="flex items-center justify-between gap-4 pt-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">Total</span>
          <span className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
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
  const feeMixTotal = stats.atlTotal + stats.gpaPoaTotal + stats.naTotal;
  const atlShare = feeMixTotal > 0 ? (stats.atlTotal / feeMixTotal) * 100 : 0;
  const gpaShare = feeMixTotal > 0 ? (stats.gpaPoaTotal / feeMixTotal) * 100 : 0;

  const farmersSubtitle =
    stats.farmersAddedThisMonth > 0
      ? `+${formatDashboardCount(stats.farmersAddedThisMonth)} this month`
      : "Registered farmers";

  return (
    <section className="dashboard-summary-grid space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600"
          value={formatDashboardCount(stats.totalFarmers)}
          title="Total Farmers"
          subtitle={farmersSubtitle}
        />
        <KpiCard
          icon={Building2}
          iconClassName="bg-emerald-50 text-emerald-600"
          value={formatDashboardCurrencyCompact(stats.totalGovtFee)}
          title="Government Fee"
          subtitle="Overall collected"
        />
        <KpiCard
          icon={AlertTriangle}
          iconClassName="bg-amber-50 text-amber-600"
          value={formatDashboardCurrencyCompact(stats.totalShortagePaid)}
          title="Total Shortage Paid"
          subtitle="Sum of shortage amount totals"
        />
        <KpiCard
          icon={IndianRupee}
          iconClassName="bg-orange-50 text-orange-600"
          value={formatDashboardCurrencyCompact(stats.naTotal)}
          title="NA Total"
          subtitle="All NA components"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard
          icon={Wallet}
          iconClassName="bg-blue-50 text-blue-600"
          value={formatDashboardCurrencyCompact(stats.atlTotal)}
          title="ATL Total"
          subtitle="Agreement to Lease"
          progress={atlShare}
        />
        <KpiCard
          icon={FileText}
          iconClassName="bg-emerald-50 text-emerald-600"
          value={formatDashboardCurrencyCompact(stats.gpaPoaTotal)}
          title="GPA / POA Total"
          subtitle="Power of Attorney fees"
          progress={gpaShare}
        />
      </div>

      <NaBreakdownCard stats={stats} />
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
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="dashboard-card-value mt-3 text-2xl font-bold tabular-nums text-slate-900">
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
