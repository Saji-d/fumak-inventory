"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO, SaleDTO, SalesHistoryPayload } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatInvoiceNo } from "@/lib/pos";
import { PaymentBadge } from "@/components/ui/PaymentBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Client-side guess at "today" in Dhaka, just to pre-select the pickers before the first fetch resolves. */
function dhakaTodayParts(): { year: number; month: number } {
  const dhaka = new Date(Date.now() + DHAKA_OFFSET_MS);
  return { year: dhaka.getUTCFullYear(), month: dhaka.getUTCMonth() + 1 };
}

export default function SalesHistoryPage() {
  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const currencySymbol = settings?.currencySymbol ?? "৳";

  const initial = dhakaTodayParts();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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
    const t = dhakaTodayParts();
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

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
          <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
          {data ? (
            <p className="text-xs text-slate-500">
              {formatNumber(data.summary.saleCount)} sale{data.summary.saleCount === 1 ? "" : "s"} ·{" "}
              {formatMoney(data.summary.totalRevenuePoisha, currencySymbol)}
            </p>
          ) : null}
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
            {data.sales.map((sale) => (
              <SaleRow key={sale.id} sale={sale} currencySymbol={currencySymbol} />
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

function SaleRow({ sale, currencySymbol }: { sale: SaleDTO; currencySymbol: string }) {
  const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <li>
      <Link
        href={`/sales/${sale.id}`}
        className="card flex items-center justify-between gap-3 p-4 transition-shadow duration-150 hover:shadow-md"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-slate-900">{formatInvoiceNo(sale)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(sale.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {itemCount} item
            {itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <PaymentBadge type={sale.paymentType} />
          <p className="w-24 text-right font-mono text-sm font-semibold text-slate-900">{formatMoney(sale.totalAmount, currencySymbol)}</p>
          <ArrowRight size={15} className="shrink-0 text-slate-300" />
        </div>
      </Link>
    </li>
  );
}
