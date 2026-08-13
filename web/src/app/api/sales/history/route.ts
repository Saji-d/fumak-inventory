import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeSale } from "@/lib/serializers";
import { dhakaMonthRange, getDhakaToday, parseDhakaDate, parseDhakaRange, type DateRange } from "@/lib/dhakaTime";

// GET /api/sales/history — completed sales only (this table is written to
// exactly once, atomically, by POST /api/sales at checkout — there is no
// "abandoned cart" or "dismissed scan" state that could leak in here).
//
// Filtering is resolved server-side to one Dhaka-local date range, in this
// priority order: from+to > date > year+month > current Dhaka month.
// Pagination applies to the sale list; the summary (count/revenue) is
// computed over the *entire* matched range, not just the current page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const dateParam = searchParams.get("date");
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  let range: DateRange;
  let resolvedYear: number;
  let resolvedMonth: number;

  if (fromParam && toParam) {
    const parsed = parseDhakaRange(fromParam, toParam);
    if (!parsed) return NextResponse.json({ error: "from/to must be YYYY-MM-DD" }, { status: 400 });
    range = parsed;
    resolvedYear = range.start.getUTCFullYear();
    resolvedMonth = range.start.getUTCMonth() + 1;
  } else if (dateParam) {
    const parsed = parseDhakaDate(dateParam);
    if (!parsed) return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    range = parsed;
    resolvedYear = range.start.getUTCFullYear();
    resolvedMonth = range.start.getUTCMonth() + 1;
  } else if (yearParam && monthParam) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "year must be an integer and month must be 1-12" }, { status: 400 });
    }
    range = dhakaMonthRange(year, month);
    resolvedYear = year;
    resolvedMonth = month;
  } else {
    const today = getDhakaToday();
    range = dhakaMonthRange(today.year, today.month);
    resolvedYear = today.year;
    resolvedMonth = today.month;
  }

  const page = pageParam ? Math.max(Number(pageParam) || 1, 1) : 1;
  const pageSize = pageParam || pageSizeParam ? Math.min(Math.max(Number(pageSizeParam) || 30, 1), 100) : 30;

  const where = { timestamp: { gte: range.start, lt: range.end } };

  const [sales, total, agg] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { items: { include: { product: { select: { id: true, name: true, barcodeValue: true, imageKey: true } } } } },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, amountPaid: true, amountDue: true } }),
  ]);

  return NextResponse.json({
    sales: sales.map(serializeSale),
    total,
    page,
    pageSize,
    summary: {
      saleCount: total,
      totalRevenuePoisha: agg._sum.totalAmount ?? 0,
      totalPaidPoisha: agg._sum.amountPaid ?? 0,
      totalDuePoisha: agg._sum.amountDue ?? 0,
    },
    range: { start: range.start.toISOString(), end: range.end.toISOString() },
    resolvedYear,
    resolvedMonth,
  });
}
