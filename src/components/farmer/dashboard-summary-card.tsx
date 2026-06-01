type Props = {
  title: string;
  value: string;
  description?: string;
  accent?: "green" | "blue";
};

export function DashboardSummaryCard({ title, value, description, accent }: Props) {
  const accentClass =
    accent === "green" ? "text-[#16A34A]" : accent === "blue" ? "text-[#2563EB]" : "text-[#111827]";

  return (
    <article className="dashboard-card flex h-auto min-h-[140px] flex-col overflow-visible rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 shadow-sm">
      <p className="dashboard-card-label shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
        {title}
      </p>
      <div
        className={`dashboard-card-value mt-2 flex-1 font-semibold tabular-nums leading-[1.2] break-words ${accentClass}`}
        aria-label={`${title}: ${value}`}
      >
        {value}
      </div>
      {description ? (
        <p className="dashboard-card-label mt-1 shrink-0 text-[11px] text-[#6B7280]">{description}</p>
      ) : null}
    </article>
  );
}
