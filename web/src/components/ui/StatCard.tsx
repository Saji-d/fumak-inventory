import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Tone drives the icon-chip color and the card's top accent border. Callers
// map their KPI's meaning to a tone (see the mapping used on the Dashboard
// and Analytics pages) instead of hardcoding one-off colors per usage.
export type StatTone = "slate" | "blue" | "indigo" | "amber" | "emerald" | "violet" | "teal" | "red";

const TONE_STYLES: Record<
  StatTone,
  { chipBg: string; chipText: string; accent: string; valueText: string }
> = {
  slate: { chipBg: "bg-slate-100", chipText: "text-slate-600", accent: "bg-slate-300", valueText: "text-slate-900" },
  blue: { chipBg: "bg-blue-50", chipText: "text-blue-600", accent: "bg-blue-500", valueText: "text-slate-900" },
  indigo: { chipBg: "bg-indigo-50", chipText: "text-indigo-600", accent: "bg-indigo-500", valueText: "text-slate-900" },
  amber: { chipBg: "bg-amber-50", chipText: "text-amber-600", accent: "bg-amber-500", valueText: "text-amber-700" },
  emerald: { chipBg: "bg-emerald-50", chipText: "text-emerald-600", accent: "bg-emerald-500", valueText: "text-slate-900" },
  violet: { chipBg: "bg-violet-50", chipText: "text-violet-600", accent: "bg-violet-500", valueText: "text-slate-900" },
  teal: { chipBg: "bg-teal-50", chipText: "text-teal-600", accent: "bg-teal-500", valueText: "text-slate-900" },
  red: { chipBg: "bg-red-50", chipText: "text-red-600", accent: "bg-red-500", valueText: "text-red-700" },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <div className="card relative overflow-hidden p-4 transition-shadow duration-150 hover:shadow-md">
      <span className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon ? (
          <span
            className={`inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 ${styles.chipBg} ${styles.chipText}`}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={2.25} />
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${styles.valueText}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
