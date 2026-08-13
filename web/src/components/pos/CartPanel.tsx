"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { formatMoney, poishaToTaka, takaToPoisha } from "@/lib/money";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { lineTotalPoisha, type CartAction, type CartLine } from "@/lib/pos";

/**
 * The persistent cart — stays visible across scans, never forces the
 * cashier to finish one product before starting the next.
 */
export function CartPanel({
  lines,
  currencySymbol,
  dispatch,
}: {
  lines: CartLine[];
  currencySymbol: string;
  dispatch: (action: CartAction) => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShoppingCart size={15} className="text-slate-400" />
          Cart · {lines.length} item{lines.length === 1 ? "" : "s"}
        </h2>
        {lines.length > 0 ? (
          <button type="button" onClick={() => setConfirmClear(true)} className="btn-danger-outline">
            <Trash2 size={13} />
            Clear
          </button>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={ShoppingCart} title="Cart is empty" description="Scan a barcode to add the first item." />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lines.map((line) => (
            <CartRow key={line.productId} line={line} currencySymbol={currencySymbol} dispatch={dispatch} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear the cart?"
        description="All scanned items will be removed from this sale."
        confirmLabel="Clear Cart"
        danger
        onConfirm={() => {
          dispatch({ type: "CLEAR" });
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function CartRow({
  line,
  currencySymbol,
  dispatch,
}: {
  line: CartLine;
  currencySymbol: string;
  dispatch: (action: CartAction) => void;
}) {
  const { product } = line;
  const style = CATEGORY_STYLES[product.category];
  const Icon = style.icon;
  const discountTaka = poishaToTaka(line.discountPoisha);
  const overStock = line.quantity > product.currentStock;

  function setQuantity(next: number) {
    if (!Number.isFinite(next) || next < 1) return;
    dispatch({ type: "SET_QUANTITY", productId: line.productId, quantity: next });
  }

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md p-1 ${style.chip}`}>
            <Icon size={12} strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">{[product.color, product.variant].filter(Boolean).join(" / ") || "—"}</p>
            <p className="font-mono text-[11px] text-slate-400">{product.barcodeValue}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "REMOVE", productId: line.productId })}
          aria-label={`Remove ${product.name}`}
          className="icon-btn shrink-0 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuantity(line.quantity - 1)}
            disabled={line.quantity <= 1}
            className="icon-btn border border-slate-200"
            aria-label="Decrease quantity"
          >
            <Minus size={13} />
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(product.currentStock, 1)}
            value={line.quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input w-14 text-center"
          />
          <button
            type="button"
            onClick={() => setQuantity(line.quantity + 1)}
            disabled={line.quantity >= product.currentStock}
            className="icon-btn border border-slate-200"
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Discount
          <input
            type="number"
            min={0}
            step="0.01"
            value={discountTaka || ""}
            placeholder="0.00"
            onChange={(e) =>
              dispatch({
                type: "SET_DISCOUNT",
                productId: line.productId,
                discountPoisha: takaToPoisha(Number(e.target.value) || 0),
              })
            }
            className="input w-20"
          />
        </label>

        <div className="text-right">
          <p className="text-xs text-slate-400">{formatMoney(product.sellingPricePoisha, currencySymbol)} each</p>
          <p className="font-mono text-sm font-semibold text-slate-900">{formatMoney(lineTotalPoisha(line), currencySymbol)}</p>
        </div>
      </div>

      {overStock ? (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <TriangleAlert size={12} />
          Only {product.currentStock} in stock — reduce quantity before checkout.
        </p>
      ) : null}
    </li>
  );
}
