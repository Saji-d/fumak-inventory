"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { DashboardPayload } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState, SkeletonStatGrid } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { PaymentBadge } from "@/components/ui/PaymentBadge";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatInvoiceNo } from "@/lib/pos";

const QUICK_ACTIONS = [
  { href: "/products/new", label: "Add Product", description: "Register a new item", icon: Plus, tone: "indigo" as const },
  { href: "/sales", label: "New Sale", description: "Scan or search to sell", icon: ShoppingCart, tone: "emerald" as const },
  { href: "/analytics", label: "View Analytics", description: "See revenue & profit trends", icon: BarChart3, tone: "violet" as const },
];

const QUICK_ACTION_TONE_CLASSES: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch<DashboardPayload>("/api/dashboard");

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonStatGrid count={7} />
        <LoadingState label="Loading dashboard…" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const currency = data.currencySymbol;
  const totalCategoryCount = data.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Products" value={formatNumber(data.totalProducts)} icon={Package} tone="indigo" />
        <StatCard label="Total Stock" value={formatNumber(data.totalStock)} icon={Boxes} tone="blue" />
        <StatCard
          label="Low Stock"
          value={formatNumber(data.lowStockCount)}
          icon={AlertTriangle}
          tone={data.lowStockCount > 0 ? "amber" : "slate"}
        />
        <StatCard label="Today's Sales" value={formatNumber(data.todaySalesCount)} icon={ShoppingCart} tone="emerald" />
        <StatCard label="Today's Revenue" value={formatMoney(data.todayRevenuePoisha, currency)} icon={CircleDollarSign} tone="violet" />
        <StatCard label="Today's Gross Profit" value={formatMoney(data.todayGrossProfitPoisha, currency)} icon={TrendingUp} tone="teal" />
        <StatCard
          label="Amount Due"
          value={formatMoney(data.totalAmountDuePoisha, currency)}
          icon={Receipt}
          tone={data.totalAmountDuePoisha > 0 ? "red" : "slate"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="card group flex items-center gap-3 p-4 transition-shadow duration-150 hover:shadow-md"
            >
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-lg p-2.5 transition-colors duration-150 ${QUICK_ACTION_TONE_CLASSES[action.tone]}`}
              >
                <Icon size={18} strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="truncate text-xs text-slate-500">{action.description}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue</h2>
              <p className="text-xs text-slate-500">Last 3 months</p>
            </div>
            <Link href="/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
              View analytics <ArrowRight size={12} />
            </Link>
          </div>
          <RevenueChart data={data.chart} currencySymbol={currency} height={220} />
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-slate-900">Products by Category</h2>
          <p className="mb-2 text-xs text-slate-500">Active catalog, {formatNumber(totalCategoryCount)} products</p>
          {data.categoryBreakdown.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-slate-400">No products yet</div>
          ) : (
            <>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="count"
                      nameKey="category"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="#ffffff"
                    >
                      {data.categoryBreakdown.map((entry) => (
                        <Cell key={entry.category} fill={CATEGORY_STYLES[entry.category].chartColor} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const num = Array.isArray(value) ? Number(value[0]) : Number(value);
                        return [`${formatNumber(Number.isFinite(num) ? num : 0)} products`, String(name ?? "")];
                      }}
                      contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.categoryBreakdown.map((entry) => {
                  const style = CATEGORY_STYLES[entry.category];
                  const Icon = style.icon;
                  return (
                    <li key={entry.category} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className={`inline-flex items-center justify-center rounded-md p-1 ${style.chip}`}>
                          <Icon size={12} strokeWidth={2.5} />
                        </span>
                        {entry.category}
                      </span>
                      <span className="font-medium text-slate-900">{formatNumber(entry.count)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-slate-900">Recent Sales</h2>
          <Link href="/sales/history" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
            View all sales <ArrowRight size={12} />
          </Link>
        </div>
        {data.recentSales.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No sales yet"
              description="Completed sales will show up here."
              showLogo
            />
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Sale</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Payment</TableHeaderCell>
                <TableHeaderCell className="text-right">Total</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.recentSales.map((sale) => (
                <TableRow key={sale.id} onClick={() => router.push(`/sales/${sale.id}`)}>
                  <TableCell className="font-mono text-xs font-medium text-slate-700">{formatInvoiceNo(sale)}</TableCell>
                  <TableCell className="text-slate-500">{new Date(sale.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sale.items.map((i) => `${i.product?.name ?? "Product"} ×${i.quantity}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge type={sale.paymentType} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-slate-900">
                    {formatMoney(sale.totalAmount, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
