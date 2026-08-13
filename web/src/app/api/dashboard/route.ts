import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPeriodRange, computeAnalyticsSummary, buildChartBuckets, fillBucketRevenue } from "@/lib/analytics";
import { isCategory } from "@/lib/types";
import { serializeSale } from "@/lib/serializers";

// GET /api/dashboard — aggregated payload for the Dashboard page.
// Reuses the same analytics-summary and chart-bucketing helpers as the
// Analytics and Inventory pages rather than reimplementing aggregation.
export async function GET() {
  const [settings, totalsAgg, recentSales, saleItemsForChart, categoryGroups] = await Promise.all([
    prisma.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.product.aggregate({
      where: { archived: false },
      _count: { _all: true },
      _sum: { currentStock: true },
    }),
    prisma.sale.findMany({
      include: { items: { include: { product: { select: { id: true, name: true, barcodeValue: true, imageKey: true } } } } },
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
    prisma.product.groupBy({
      by: ["category"],
      where: { archived: false },
      _count: { _all: true },
    }),
  ]);

  const lowStockCount = await prisma.product.count({
    where: { archived: false, currentStock: { lte: settings.lowStockThreshold } },
  });

  const todaySummary = await computeAnalyticsSummary(getPeriodRange("today"));

  const chartPoints = saleItemsForChart.items.map((item) => ({
    timestamp: item.sale.timestamp,
    amountPoisha: item.sellingPriceEachPoisha * item.quantity - item.discountPoisha,
  }));
  const filledChart = fillBucketRevenue(saleItemsForChart.buckets, chartPoints);

  const categoryBreakdown = categoryGroups
    .filter((g) => isCategory(g.category))
    .map((g) => ({ category: g.category, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalProducts: totalsAgg._count._all,
    totalStock: totalsAgg._sum.currentStock ?? 0,
    lowStockCount,
    todaySalesCount: todaySummary.saleCount,
    todayRevenuePoisha: todaySummary.totalRevenuePoisha,
    todayGrossProfitPoisha: todaySummary.grossProfitPoisha,
    todayItemsSold: todaySummary.totalItemsSold,
    recentSales: recentSales.map(serializeSale),
    chart: filledChart.map((b) => ({ label: b.label, revenuePoisha: b.revenuePoisha })),
    categoryBreakdown,
    currencySymbol: settings.currencySymbol,
  });
}
