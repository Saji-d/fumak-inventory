"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export interface RevenueChartPoint {
  label: string;
  revenuePoisha: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currencySymbol: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      <span className="w-1 shrink-0 bg-indigo-500" aria-hidden="true" />
      <div className="px-3 py-2 text-xs">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-slate-500">
          Revenue{" "}
          <span className="font-semibold text-slate-900">
            {formatMoney(payload[0].value, currencySymbol)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function RevenueChart({
  data,
  currencySymbol = "৳",
  height = 260,
}: {
  data: RevenueChartPoint[];
  currencySymbol?: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#4338ca" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatMoney(v, currencySymbol)}
            width={80}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={<CustomTooltip currencySymbol={currencySymbol} />}
          />
          <Bar dataKey="revenuePoisha" fill="url(#revenueBarFill)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
