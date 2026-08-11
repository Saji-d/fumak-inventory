import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildChartBuckets, fillBucketRevenue, type ChartRange } from "@/lib/analytics";

const VALID_RANGES: ChartRange[] = ["3m", "6m", "1y"];

// GET /api/analytics/chart?range=3m|6m|1y — bucketed weekly for 3m/6m,
// monthly for 1y.
export async function GET(request: NextRequest) {
  const rangeParam = (new URL(request.url).searchParams.get("range") ?? "3m") as ChartRange;
  if (!VALID_RANGES.includes(rangeParam)) {
    return NextResponse.json({ error: "range must be one of 3m, 6m, 1y" }, { status: 400 });
  }

  const buckets = buildChartBuckets(rangeParam);
  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;

  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { timestamp: { gte: rangeStart, lt: rangeEnd } } },
    include: { sale: { select: { timestamp: true } } },
  });

  const points = saleItems.map((item) => ({
    timestamp: item.sale.timestamp,
    amountPoisha: item.sellingPriceEachPoisha * item.quantity - item.discountPoisha,
  }));

  const filled = fillBucketRevenue(buckets, points);

  return NextResponse.json(
    filled.map((b) => ({ label: b.label, revenuePoisha: b.revenuePoisha }))
  );
}
