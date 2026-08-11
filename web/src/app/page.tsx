"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import type { DashboardPayload } from "@/lib/types";
import { PAYMENT_TYPE_LABELS } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatMoney, formatNumber } from "@/lib/money";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardPayload>("/api/dashboard");

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const currency = data.currencySymbol;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Products" value={formatNumber(data.totalProducts)} />
        <StatCard label="Total Stock" value={formatNumber(data.totalStock)} />
        <StatCard
          label="Low Stock"
          value={formatNumber(data.lowStockCount)}
          tone={data.lowStockCount > 0 ? "warning" : "default"}
        />
        <StatCard label="Today's Sales" value={formatNumber(data.todaySalesCount)} />
        <StatCard label="Today's Revenue" value={formatMoney(data.todayRevenuePoisha, currency)} />
        <StatCard label="Today's Gross Profit" value={formatMoney(data.todayGrossProfitPoisha, currency)} />
        <StatCard
          label="Amount Due"
          value={formatMoney(data.totalAmountDuePoisha, currency)}
          tone={data.totalAmountDuePoisha > 0 ? "danger" : "default"}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Revenue (last 3 months)</h2>
          <Link href="/analytics" className="text-xs font-medium text-slate-500 hover:text-slate-900">
            View analytics →
          </Link>
        </div>
        <RevenueChart data={data.chart} currencySymbol={currency} height={220} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent Sales</h2>
          <Link href="/sales" className="text-xs font-medium text-slate-500 hover:text-slate-900">
            Go to sales →
          </Link>
        </div>
        {data.recentSales.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No sales yet" description="Completed sales will show up here." />
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Payment</TableHeaderCell>
                <TableHeaderCell className="text-right">Total</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    {sale.items.map((i) => `${i.product?.name ?? "Product"} ×${i.quantity}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{PAYMENT_TYPE_LABELS[sale.paymentType]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
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
