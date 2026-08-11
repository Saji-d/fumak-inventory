import { NextRequest, NextResponse } from "next/server";
import { getPeriodRange, computeAnalyticsSummary } from "@/lib/analytics";
import type { AnalyticsPeriod } from "@/lib/types";

const VALID_PERIODS: AnalyticsPeriod[] = [
  "today",
  "current_month",
  "last_3_months",
  "last_6_months",
  "current_year",
  "custom",
];

// GET /api/analytics/summary?period=today|current_month|last_3_months|last_6_months|current_year|custom&start=&end=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "current_month") as AnalyticsPeriod;

  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }
  if (period === "custom" && (!searchParams.get("start") || !searchParams.get("end"))) {
    return NextResponse.json({ error: "start and end are required for a custom period" }, { status: 400 });
  }

  const range = getPeriodRange(period, {
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const summary = await computeAnalyticsSummary(range);

  return NextResponse.json({
    ...summary,
    period,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  });
}
