"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO, SaleDTO, SaleItemDTO, SalesHistoryPayload } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatInvoiceNo } from "@/lib/pos";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";
import { SaleRow } from "@/components/pos/SaleRow";
import { getDhakaToday, getDhakaTodayIso } from "@/lib/dhakaTime";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ViewMode = "sales" | "items";

export default function SalesHistoryPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sales history…" />}>
      <SalesHistoryPageContent />
    </Suspense>
  );
}

function SalesHistoryPageContent() {
  const searchParams = useSearchParams();

  // ?date=today resolves to the actual current Dhaka date once, on first
  // render; ?date=YYYY-MM-DD is used as-is. Both just seed the same dayFilter
  // state the manual date picker already drives — nothing downstream needs
  // to know whether the filter came from a link or a click.
  const initialDateParam = searchParams.get("date");
  const initialDayFilter =
    initialDateParam === "today" ? getDhakaTodayIso() : initialDateParam && /^\d{4}-\d{2}-\d{2}$/.test(initialDateParam) ? initialDateParam : null;
  const initialView: ViewMode = searchParams.get("view") === "items" ? "items" : "sales";

  const initial = getDhakaToday();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [dayFilter, setDayFilter] = useState<string | null>(initialDayFilter);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>(initialView);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (dayFilter) {
      params.set("date", dayFilter);
    } else {
      params.set("year", String(year));
      params.set("month", String(month));
    }
    params.set("page", String(page));
    return `/api/sales/history?${params.toString()}`;
  }, [year, month, dayFilter, page]);

  const { data, loading, error, refetch } = useFetch<SalesHistoryPayload>(url);
  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const currencySymbol = settings?.currencySymbol ?? "৳";

  function goToMonth(delta: number) {
    setDayFilter(null);
    setPage(1);
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  function handleMonthInputChange(value: string) {
    const [y, m] = value.split("-").map(Number);
    if (!y || !m) return;
    setYear(y);
    setMonth(m);
    setDayFilter(null);
    setPage(1);
  }

  function handleDateInputChange(value: string) {
    setDayFilter(value || null);
    setPage(1);
  }

  function resetToCurrentMonth() {
    const t = getDhakaToday();
    setYear(t.year);
    setMonth(t.month);
    setDayFilter(null);
    setPage(1);
  }

  const monthInputValue = `${year}-${String(month).padStart(2, "0")}`;
  const heading = dayFilter
    ? new Date(`${dayFilter}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : `${MONTH_NAMES[month - 1]} ${year}`;

  const pageSize = data?.pageSize ?? 30;
  const totalPages = data ? Math.max(Math.ceil(data.total / pageSize), 1) : 1;

  const items = useMemo(() => {
    if (!data) return [];
    return data.sales.flatMap((sale) => sale.items.map((item) => ({ item, sale })));
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Sales History</h1>
          <p className="text-xs text-slate-500">Completed sales only — scans and abandoned carts never show up here.</p>
        </div>
        <Link href="/sales" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          <ArrowLeft size={13} />
          Back to POS
        </Link>
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => goToMonth(-1)} className="icon-btn border border-slate-200" aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <input type="month" value={monthInputValue} onChange={(e) => handleMonthInputChange(e.target.value)} className="input w-auto" />
          <button type="button" onClick={() => goToMonth(1)} className="icon-btn border border-slate-200" aria-label="Next month">
            <ChevronRight size={15} />
          </button>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={13} />
            <input type="date" value={dayFilter ?? ""} onChange={(e) => handleDateInputChange(e.target.value)} className="input w-auto" />
          </label>

          {dayFilter ? (
            <button type="button" onClick={() => setDayFilter(null)} className="btn-secondary text-xs">
              Clear date
            </button>
          ) : null}

          <button type="button" onClick={resetToCurrentMonth} className="ml-auto btn-secondary text-xs">
            This month
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
            {data ? (
              <p className="text-xs text-slate-500">
                {formatNumber(data.summary.saleCount)} sale{data.summary.saleCount === 1 ? "" : "s"} ·{" "}
                {formatMoney(data.summary.totalRevenuePoisha, currencySymbol)}
              </p>
            ) : null}
          </div>

          <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView("sales")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                view === "sales" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              By Sale
            </button>
            <button
              type="button"
              onClick={() => setView("items")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                view === "items" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              By Item
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading sales…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.sales.length === 0 ? (
        <EmptyState icon={Receipt} title="No sales in this range" description="Completed sales will show up here." />
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {view === "sales"
              ? data.sales.map((sale) => <SaleRow key={sale.id} sale={sale} currencySymbol={currencySymbol} />)
              : items.map(({ item, sale }) => (
                  <SaleItemRow key={item.id} item={item} sale={sale} currencySymbol={currencySymbol} />
                ))}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-xs">
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-xs">
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/**
 * One sold line-item — the same underlying data as SaleRow, just flattened
 * to product granularity. Revenue/profit are plain arithmetic on the
 * historical per-item fields already stored on the sale (sellingPriceEach,
 * buyingCostEach, discount) — the same formula the dashboard's gross-profit
 * KPI uses in aggregate, not a separate calculation.
 */
function SaleItemRow({ item, sale, currencySymbol }: { item: SaleItemDTO; sale: SaleDTO; currencySymbol: string }) {
  const revenue = item.sellingPriceEachPoisha * item.quantity - item.discountPoisha;
  const cost = item.buyingCostEachPoisha * item.quantity;
  const profit = revenue - cost;

  return (
    <li>
      <Link
        href={`/sales/${sale.id}`}
        className="card flex items-center gap-3 p-3 transition-shadow duration-150 hover:shadow-md"
      >
        <ProductImage
          src={item.product?.imageUrl}
          alt={item.product?.name ?? "Product"}
          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200"
          iconSize={16}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{item.product?.name ?? `Product #${item.productId}`}</p>
          <p className="text-xs text-slate-500">
            {formatInvoiceNo(sale)} · {new Date(sale.timestamp).toLocaleTimeString("en-US", { timeStyle: "short" })}
          </p>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-slate-500 sm:block">
          <p>
            Qty <span className="font-medium text-slate-900">{item.quantity}</span>
          </p>
          <p>
            Unit <span className="font-mono text-slate-900">{formatMoney(item.sellingPriceEachPoisha, currencySymbol)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold text-slate-900">{formatMoney(revenue, currencySymbol)}</p>
          <p className={`font-mono text-xs ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {profit >= 0 ? "+" : ""}
            {formatMoney(profit, currencySymbol)} profit
          </p>
        </div>
        <ArrowRight size={15} className="shrink-0 text-slate-300" />
      </Link>
    </li>
  );
}
