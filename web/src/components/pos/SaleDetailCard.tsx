"use client";

import type { SaleDTO } from "@/lib/types";
import { isCategory } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatInvoiceNo } from "@/lib/pos";
import { PaymentBadge } from "@/components/ui/PaymentBadge";
import { ProductImage } from "@/components/ui/ProductImage";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";

/**
 * The rich, on-screen sale detail — distinct from SaleReceipt (which stays
 * print-focused/minimal). Renders only what's already stored on the SaleDTO
 * (historical unit price, discount, etc.) — never recomputed from a
 * product's current price, so an old sale stays accurate even after prices
 * change.
 */
export function SaleDetailCard({ sale, currencySymbol }: { sale: SaleDTO; currencySymbol: string }) {
  const subtotalPoisha = sale.items.reduce((sum, item) => sum + item.sellingPriceEachPoisha * item.quantity, 0);
  const discountPoisha = sale.items.reduce((sum, item) => sum + item.discountPoisha, 0);
  const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const saleDate = new Date(sale.timestamp);

  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-900 px-5 py-4 text-white">
        <p className="font-mono text-lg font-bold tracking-tight">{formatInvoiceNo(sale)}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <DetailStat label="Date" value={saleDate.toLocaleDateString("en-US", { dateStyle: "medium" })} />
          <DetailStat label="Time" value={saleDate.toLocaleTimeString("en-US", { timeStyle: "short" })} />
          <DetailStat label="Payment" value={<PaymentBadge type={sale.paymentType} />} />
          <DetailStat label="Items" value={formatNumber(totalItems)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryStat label="Subtotal" value={formatMoney(subtotalPoisha, currencySymbol)} />
        <SummaryStat label="Discount" value={discountPoisha > 0 ? `-${formatMoney(discountPoisha, currencySymbol)}` : formatMoney(0, currencySymbol)} />
        <SummaryStat label="Total" value={formatMoney(sale.totalAmount, currencySymbol)} strong />
        <SummaryStat label="Amount Paid" value={formatMoney(sale.amountPaid, currencySymbol)} />
        <SummaryStat label="Change" value={formatMoney(sale.changeAmount, currencySymbol)} tone={sale.changeAmount > 0 ? "positive" : undefined} />
        {/* This app has no credit/partial-payment feature, so amountDue is 0 for
            every sale completed after that check was added — only shown here for
            older sales that predate it, where it's real historical data. */}
        {sale.amountDue > 0 ? (
          <SummaryStat label="Amount Due" value={formatMoney(sale.amountDue, currencySymbol)} tone="danger" />
        ) : null}
      </div>

      <ul className="divide-y divide-slate-100">
        {sale.items.map((item) => {
          const category = item.product?.category;
          const style = category && isCategory(category) ? CATEGORY_STYLES[category] : null;
          const Icon = style?.icon;
          const lineTotal = item.sellingPriceEachPoisha * item.quantity - item.discountPoisha;
          return (
            <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{item.product?.name ?? `Product #${item.productId}`}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {item.product?.barcodeValue ? (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{item.product.barcodeValue}</span>
                  ) : null}
                  {style && Icon ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${style.bg} ${style.text}`}>
                      <Icon size={10} strokeWidth={2.5} />
                      {category}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    Qty <span className="font-medium text-slate-900">{formatNumber(item.quantity)}</span>
                  </span>
                  <span>
                    Unit <span className="font-mono font-medium text-slate-900">{formatMoney(item.sellingPriceEachPoisha, currencySymbol)}</span>
                  </span>
                  {item.discountPoisha > 0 ? (
                    <span>
                      Discount <span className="font-mono font-medium text-red-600">-{formatMoney(item.discountPoisha, currencySymbol)}</span>
                    </span>
                  ) : null}
                  <span>
                    Line Total <span className="font-mono font-semibold text-slate-900">{formatMoney(lineTotal, currencySymbol)}</span>
                  </span>
                </div>
              </div>
              <ProductImage
                src={item.product?.imageUrl}
                alt={item.product?.name ?? "Product"}
                className="aspect-[3/4] h-24 w-[72px] shrink-0 rounded-lg border border-slate-200"
                iconSize={20}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 font-medium text-white">{value}</div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "positive" | "danger";
}) {
  const valueClass = tone === "positive" ? "text-emerald-600" : tone === "danger" ? "text-red-600" : "text-slate-900";
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 font-mono tabular-nums ${strong ? "text-base font-bold text-slate-900" : `text-sm font-semibold ${valueClass}`}`}>{value}</p>
    </div>
  );
}
