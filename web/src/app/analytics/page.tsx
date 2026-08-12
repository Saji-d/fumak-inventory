"use client";

import { useMemo, useState } from "react";
import {
  BadgePercent,
  BarChart3,
  Coins,
  CreditCard,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import type { ChartRange } from "@/lib/analytics";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState, SkeletonStatGrid } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RevenueChart, type RevenueChartPoint } from "@/components/charts/RevenueChart";

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "current_month", label: "This Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "current_year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
];

interface SummaryResponse extends AnalyticsSummary {
  start: string;
  end: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            value === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("current_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("3m");

  const summaryUrl = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === "custom" && customStart && customEnd) {
      params.set("start", customStart);
      params.set("end", customEnd);
    }
    return `/api/analytics/summary?${params.toString()}`;
  }, [period, customStart, customEnd]);

  const summaryEnabled = period !== "custom" || (customStart && customEnd);
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } =
    useFetch<SummaryResponse>(summaryEnabled ? summaryUrl : null);

  const { data: chart, loading: chartLoading, error: chartError, refetch: refetchChart } =
    useFetch<RevenueChartPoint[]>(`/api/analytics/chart?range=${chartRange}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex flex-col gap-3 p-4">
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        {period === "custom" ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              From
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input w-auto" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              To
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input w-auto" />
            </label>
          </div>
        ) : null}
      </div>

      {!summaryEnabled ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Choose a start and end date to see custom-range analytics.
        </p>
      ) : summaryLoading ? (
        <SkeletonStatGrid count={8} />
      ) : summaryError ? (
        <ErrorState message={summaryError} onRetry={refetchSummary} />
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={formatMoney(summary.totalRevenuePoisha)} icon={Coins} tone="violet" />
          <StatCard label="Items Sold" value={formatNumber(summary.totalItemsSold)} icon={Package} tone="blue" />
          <StatCard label="Buying Cost" value={formatMoney(summary.totalBuyingCostPoisha)} icon={ShoppingBag} tone="indigo" />
          <StatCard label="Gross Profit" value={formatMoney(summary.grossProfitPoisha)} icon={TrendingUp} tone="teal" />
          <StatCard label="Discounts Given" value={formatMoney(summary.totalDiscountPoisha)} icon={BadgePercent} tone="amber" />
          <StatCard label="Amount Paid" value={formatMoney(summary.totalPaidPoisha)} icon={CreditCard} tone="emerald" />
          <StatCard
            label="Amount Due"
            value={formatMoney(summary.totalDuePoisha)}
            icon={Receipt}
            tone={summary.totalDuePoisha > 0 ? "red" : "slate"}
          />
          <StatCard label="Number of Sales" value={formatNumber(summary.saleCount)} icon={Wallet} tone="slate" />
        </div>
      ) : null}

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BarChart3 size={15} className="text-slate-400" />
            Revenue Trend
          </h2>
          <SegmentedControl options={RANGE_OPTIONS} value={chartRange} onChange={setChartRange} />
        </div>
        {chartLoading ? (
          <LoadingState label="Loading chart…" />
        ) : chartError ? (
          <ErrorState message={chartError} onRetry={refetchChart} />
        ) : chart ? (
          <RevenueChart data={chart} height={300} />
        ) : null}
      </div>
    </div>
  );
}
