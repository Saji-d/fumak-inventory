"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Printer, ShoppingCart } from "lucide-react";
import type { SaleDTO } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { PaymentBadge } from "@/components/ui/PaymentBadge";
import { formatInvoiceNo } from "@/lib/pos";

/**
 * The printable invoice — rendered entirely from a persisted SaleDTO
 * (never from cart state), so it's identical whether shown immediately
 * after checkout or reprinted later from /sales/[id].
 */
export function SaleReceipt({
  sale,
  currencySymbol,
  showActions = false,
  onNewSale,
  hideOpenFullReceiptLink = false,
}: {
  sale: SaleDTO;
  currencySymbol: string;
  showActions?: boolean;
  onNewSale?: () => void;
  hideOpenFullReceiptLink?: boolean;
}) {
  const subtotalPoisha = sale.items.reduce((sum, item) => sum + item.sellingPriceEachPoisha * item.quantity, 0);
  const discountPoisha = sale.items.reduce((sum, item) => sum + item.discountPoisha, 0);

  return (
    <div className="card overflow-hidden">
      <div id="receipt-print-root" className="p-5">
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="FUMAK" width={36} height={36} className="rounded-full object-contain shadow-sm" />
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight text-slate-900">FUMAK</p>
              <p className="text-[11px] font-medium text-slate-500">Inventory &amp; Sales</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-slate-900">{formatInvoiceNo(sale)}</p>
            <p className="text-xs text-slate-500">{new Date(sale.timestamp).toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit Price</th>
              <th className="pb-2 text-right">Discount</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">
                  <p className="font-medium text-slate-900">{item.product?.name ?? `Product #${item.productId}`}</p>
                  {item.product?.color || item.product?.variant ? (
                    <p className="text-xs text-slate-500">
                      {[item.product?.color, item.product?.variant].filter(Boolean).join(" / ")}
                    </p>
                  ) : null}
                </td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right font-mono tabular-nums">{formatMoney(item.sellingPriceEachPoisha, currencySymbol)}</td>
                <td className="py-2 text-right font-mono tabular-nums text-slate-500">
                  {item.discountPoisha > 0 ? `-${formatMoney(item.discountPoisha, currencySymbol)}` : "—"}
                </td>
                <td className="py-2 text-right font-mono font-medium tabular-nums text-slate-900">
                  {formatMoney(item.sellingPriceEachPoisha * item.quantity - item.discountPoisha, currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-[260px] space-y-1.5 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(subtotalPoisha, currencySymbol)} />
            <SummaryRow label="Discount" value={`-${formatMoney(discountPoisha, currencySymbol)}`} />
            <SummaryRow label="Grand Total" value={formatMoney(sale.totalAmount, currencySymbol)} strong />
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500">Payment</span>
              <PaymentBadge type={sale.paymentType} />
            </div>
            <SummaryRow label="Amount Paid" value={formatMoney(sale.amountPaid, currencySymbol)} />
            {sale.changeAmount > 0 ? (
              <SummaryRow label="Change" value={formatMoney(sale.changeAmount, currencySymbol)} tone="positive" />
            ) : null}
            {sale.amountDue > 0 ? <SummaryRow label="Amount Due" value={formatMoney(sale.amountDue, currencySymbol)} tone="danger" /> : null}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Thank you for shopping with FUMAK.</p>
      </div>

      {showActions ? (
        <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          {!hideOpenFullReceiptLink ? (
            <Link href={`/sales/${sale.id}`} className="btn-secondary">
              Open full receipt
              <ArrowRight size={13} />
            </Link>
          ) : null}
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <Printer size={14} />
            Print
          </button>
          {onNewSale ? (
            <button type="button" onClick={onNewSale} className="btn-primary">
              <ShoppingCart size={14} />
              New Sale
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({
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
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-500"}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? "text-base font-bold text-slate-900" : `text-sm ${valueClass}`}`}>{value}</span>
    </div>
  );
}
