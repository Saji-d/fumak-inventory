"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SaleDTO } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { formatInvoiceNo } from "@/lib/pos";
import { PaymentBadge } from "@/components/ui/PaymentBadge";

/**
 * One clickable sale summary row — shared by the Sales History list and the
 * Analytics page's embedded "today's transactions" list, so both present the
 * same sale the same way instead of drifting into two implementations.
 */
export function SaleRow({ sale, currencySymbol }: { sale: SaleDTO; currencySymbol: string }) {
  const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemSummary = sale.items.map((i) => `${i.product?.name ?? "Product"} ×${i.quantity}`).join(", ");

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
          <p className="mt-0.5 truncate text-xs text-slate-400">{itemSummary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <PaymentBadge type={sale.paymentType} />
            {sale.changeAmount > 0 ? (
              <p className="mt-1 text-[11px] text-emerald-600">Change {formatMoney(sale.changeAmount, currencySymbol)}</p>
            ) : null}
          </div>
          <p className="w-24 text-right font-mono text-sm font-semibold text-slate-900">{formatMoney(sale.totalAmount, currencySymbol)}</p>
          <ArrowRight size={15} className="shrink-0 text-slate-300" />
        </div>
      </Link>
    </li>
  );
}
