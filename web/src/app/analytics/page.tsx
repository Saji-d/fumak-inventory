"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import type { ChartRange } from "@/lib/analytics";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
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
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                period === opt.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period === "custom" ? (
          <div className="flex flex-wrap items-center gap-3">
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
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Choose a start and end date to see custom-range analytics.
        </p>
      ) : summaryLoading ? (
        <LoadingState label="Loading summary…" />
      ) : summaryError ? (
        <ErrorState message={summaryError} onRetry={refetchSummary} />
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={formatMoney(summary.totalRevenuePoisha)} />
          <StatCard label="Items Sold" value={formatNumber(summary.totalItemsSold)} />
          <StatCard label="Buying Cost" value={formatMoney(summary.totalBuyingCostPoisha)} />
          <StatCard label="Gross Profit" value={formatMoney(summary.grossProfitPoisha)} />
          <StatCard label="Discounts Given" value={formatMoney(summary.totalDiscountPoisha)} />
          <StatCard label="Amount Paid" value={formatMoney(summary.totalPaidPoisha)} />
          <StatCard
            label="Amount Due"
            value={formatMoney(summary.totalDuePoisha)}
            tone={summary.totalDuePoisha > 0 ? "danger" : "default"}
          />
          <StatCard label="Number of Sales" value={formatNumber(summary.saleCount)} />
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Revenue Trend</h2>
          <div className="flex gap-1.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setChartRange(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  chartRange === opt.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
