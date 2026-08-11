import { prisma } from "@/lib/db";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/lib/types";

// Period -> {start,end} date range mapping, and chart bucketing helpers.
// Plain Date arithmetic only — no extra date library needed for a scope
// this small.

export interface DateRange {
  start: Date;
  end: Date;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function getPeriodRange(
  period: AnalyticsPeriod,
  custom?: { start?: string | null; end?: string | null }
): DateRange {
  const now = new Date();

  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "current_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case "last_3_months":
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())),
        end: endOfDay(now),
      };
    case "last_6_months":
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())),
        end: endOfDay(now),
      };
    case "current_year":
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case "custom": {
      const start = custom?.start ? startOfDay(new Date(custom.start)) : startOfDay(now);
      const end = custom?.end ? endOfDay(new Date(custom.end)) : endOfDay(now);
      return { start, end };
    }
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export type ChartRange = "3m" | "6m" | "1y";

export interface ChartBucket {
  label: string;
  start: Date;
  end: Date; // exclusive
  revenuePoisha: number;
}

/**
 * Builds empty buckets covering the requested range, ending "now".
 * 3m / 6m are bucketed weekly, 1y is bucketed monthly.
 */
export function buildChartBuckets(range: ChartRange, now: Date = new Date()): ChartBucket[] {
  const buckets: ChartBucket[] = [];

  if (range === "1y") {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        label: start.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        start,
        end,
        revenuePoisha: 0,
      });
    }
    return buckets;
  }

  const weeks = range === "3m" ? 13 : 26;
  const todayStart = startOfDay(now);
  const endExclusive = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(endExclusive.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    buckets.push({
      label: start.toLocaleString("en-US", { month: "short", day: "numeric" }),
      start,
      end,
      revenuePoisha: 0,
    });
  }
  return buckets;
}

/**
 * Shared aggregation used by both the Analytics page and the Dashboard,
 * so the metric definitions live in exactly one place.
 *
 * totalRevenue    = sum(sellingPriceEach*qty - discount) over SaleItems in range
 * totalItemsSold  = sum(quantity)
 * totalBuyingCost = sum(buyingCostEach*qty)
 * grossProfit     = totalRevenue - totalBuyingCost (computed in JS, not SQL)
 * totalDiscount   = sum(discount)
 * totalPaid       = sum(Sale.amountPaid) in range
 * totalDue        = sum(Sale.amountDue) in range
 */
export async function computeAnalyticsSummary(range: DateRange): Promise<AnalyticsSummary> {
  const sales = await prisma.sale.findMany({
    where: { timestamp: { gte: range.start, lte: range.end } },
    include: { items: true },
  });

  let totalRevenuePoisha = 0;
  let totalItemsSold = 0;
  let totalBuyingCostPoisha = 0;
  let totalDiscountPoisha = 0;
  let totalPaidPoisha = 0;
  let totalDuePoisha = 0;

  for (const sale of sales) {
    totalPaidPoisha += sale.amountPaid;
    totalDuePoisha += sale.amountDue;
    for (const item of sale.items) {
      totalRevenuePoisha += item.sellingPriceEachPoisha * item.quantity - item.discountPoisha;
      totalItemsSold += item.quantity;
      totalBuyingCostPoisha += item.buyingCostEachPoisha * item.quantity;
      totalDiscountPoisha += item.discountPoisha;
    }
  }

  return {
    totalRevenuePoisha,
    totalItemsSold,
    totalBuyingCostPoisha,
    grossProfitPoisha: totalRevenuePoisha - totalBuyingCostPoisha,
    totalDiscountPoisha,
    totalPaidPoisha,
    totalDuePoisha,
    saleCount: sales.length,
  };
}

/** Sums each item's amount into the bucket whose [start,end) it falls in. */
export function fillBucketRevenue(
  buckets: ChartBucket[],
  items: { timestamp: Date; amountPoisha: number }[]
): ChartBucket[] {
  const filled = buckets.map((b) => ({ ...b }));
  for (const item of items) {
    const t = item.timestamp.getTime();
    for (const b of filled) {
      if (t >= b.start.getTime() && t < b.end.getTime()) {
        b.revenuePoisha += item.amountPoisha;
        break;
      }
    }
  }
  return filled;
}
