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
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="mt-0.5 text-slate-600">
        Revenue: <span className="font-semibold">{formatMoney(payload[0].value, currencySymbol)}</span>
      </p>
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatMoney(v, currencySymbol)}
            width={80}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            content={<CustomTooltip currencySymbol={currencySymbol} />}
          />
          <Bar dataKey="revenuePoisha" fill="#0f172a" radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
