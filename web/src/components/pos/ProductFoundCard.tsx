"use client";

import Link from "next/link";
import { Archive, CheckCircle2, Eye, ShoppingCart, TriangleAlert, X } from "lucide-react";
import type { ProductDTO } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { Badge } from "@/components/ui/Badge";
import type { CartLine } from "@/lib/pos";
import { availableToAdd } from "@/lib/pos";

/**
 * The persistent "Product Found" result — stays on screen until the
 * cashier dismisses it or takes an action; never auto-navigates or
 * auto-adds to the cart.
 */
export function ProductFoundCard({
  product,
  lines,
  lowStockThreshold,
  currencySymbol,
  onAddToCart,
  onDismiss,
}: {
  product: ProductDTO;
  lines: CartLine[];
  lowStockThreshold: number;
  currencySymbol: string;
  onAddToCart: (product: ProductDTO) => void;
  onDismiss: () => void;
}) {
  const style = CATEGORY_STYLES[product.category];
  const Icon = style.icon;
  const remaining = availableToAdd(product, lines);
  const canAdd = remaining > 0;

  return (
    <div className="card overflow-hidden border-emerald-200">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <CheckCircle2 size={14} />
          Product Found
        </span>
        <button onClick={onDismiss} aria-label="Dismiss" className="icon-btn">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900">{product.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{[product.color, product.variant].filter(Boolean).join(" / ") || "—"}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                <Icon size={11} strokeWidth={2.5} />
                {product.category}
              </span>
              {product.archived ? (
                <Badge variant="warning">
                  <Archive size={11} />
                  Archived
                </Badge>
              ) : null}
            </div>
            <p className="mt-1.5 font-mono text-xs text-slate-400">Barcode: {product.barcodeValue}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold tabular-nums text-slate-900">{formatMoney(product.sellingPricePoisha, currencySymbol)}</p>
            <p className="text-xs text-slate-400">Buying {formatMoney(product.buyingPricePoisha, currencySymbol)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-xs font-medium text-slate-600">Current stock</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900">{formatNumber(product.currentStock)}</span>
            {product.currentStock === 0 ? (
              <Badge variant="danger">Out of stock</Badge>
            ) : product.currentStock <= lowStockThreshold ? (
              <Badge variant="warning">Low stock</Badge>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
          </span>
        </div>

        {!canAdd ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            {product.currentStock === 0
              ? "Out of stock — add stock on the product page before selling it."
              : `All ${product.currentStock} in stock ${product.currentStock === 1 ? "is" : "are"} already in the cart.`}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Link href={`/products/${product.id}`} className="btn-secondary flex-1">
            <Eye size={14} />
            View Product
          </Link>
          <button type="button" onClick={() => onAddToCart(product)} disabled={!canAdd} className="btn-primary flex-1">
            <ShoppingCart size={14} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
