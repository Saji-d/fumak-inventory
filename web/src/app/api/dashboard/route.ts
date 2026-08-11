import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPeriodRange, computeAnalyticsSummary, buildChartBuckets, fillBucketRevenue } from "@/lib/analytics";

// GET /api/dashboard — aggregated payload for the Dashboard page.
// Reuses the same analytics-summary and chart-bucketing helpers as the
// Analytics and Inventory pages rather than reimplementing aggregation.
export async function GET() {
  const [settings, totalsAgg, recentSales, saleItemsForChart] = await Promise.all([
    prisma.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.product.aggregate({
      where: { archived: false },
      _count: { _all: true },
      _sum: { currentStock: true },
    }),
    prisma.sale.findMany({
      include: { items: { include: { product: { select: { id: true, name: true, barcodeValue: true } } } } },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
    (async () => {
      const buckets = buildChartBuckets("3m");
      const items = await prisma.saleItem.findMany({
        where: { sale: { timestamp: { gte: buckets[0].start, lt: buckets[buckets.length - 1].end } } },
        include: { sale: { select: { timestamp: true } } },
      });
      return { buckets, items };
    })(),
  ]);

  const lowStockCount = await prisma.product.count({
    where: { archived: false, currentStock: { lte: settings.lowStockThreshold } },
  });

  const todaySummary = await computeAnalyticsSummary(getPeriodRange("today"));

  const dueAgg = await prisma.sale.aggregate({ _sum: { amountDue: true } });

  const chartPoints = saleItemsForChart.items.map((item) => ({
    timestamp: item.sale.timestamp,
    amountPoisha: item.sellingPriceEachPoisha * item.quantity - item.discountPoisha,
  }));
  const filledChart = fillBucketRevenue(saleItemsForChart.buckets, chartPoints);

  return NextResponse.json({
    totalProducts: totalsAgg._count._all,
    totalStock: totalsAgg._sum.currentStock ?? 0,
    lowStockCount,
    todaySalesCount: todaySummary.saleCount,
    todayRevenuePoisha: todaySummary.totalRevenuePoisha,
    todayGrossProfitPoisha: todaySummary.grossProfitPoisha,
    totalAmountDuePoisha: dueAgg._sum.amountDue ?? 0,
    recentSales,
    chart: filledChart.map((b) => ({ label: b.label, revenuePoisha: b.revenuePoisha })),
    currencySymbol: settings.currencySymbol,
  });
}
