"use client";

import { useEffect, useState } from "react";
import type { ProductDTO, SaleDTO } from "@/lib/types";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, type PaymentType } from "@/lib/types";
import { formatMoney, takaToPoisha, poishaToTaka } from "@/lib/money";
import { BarcodeInput } from "@/components/barcode/BarcodeInput";
import { Badge } from "@/components/ui/Badge";

export default function SalesPage() {
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [nameResults, setNameResults] = useState<ProductDTO[]>([]);
  const [lastSale, setLastSale] = useState<SaleDTO | null>(null);

  useEffect(() => {
    const query = nameQuery.trim();
    if (!query) {
      setNameResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: ProductDTO[]) => setNameResults(data.slice(0, 6)))
        .catch(() => setNameResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [nameQuery]);

  function selectProduct(p: ProductDTO) {
    setProduct(p);
    setNameQuery("");
    setNameResults([]);
    setLastSale(null);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {lastSale ? <SaleConfirmation sale={lastSale} onDismiss={() => setLastSale(null)} /> : null}

      {!product ? (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Scan Barcode</h2>
            <BarcodeInput onFound={selectProduct} />
          </div>

          <div className="relative">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Or Search by Name</h2>
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Type a product name…"
              className="input"
            />
            {nameResults.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                {nameResults.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => selectProduct(p)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        {p.name}
                        <span className="ml-1 text-xs text-slate-500">
                          {[p.color, p.variant].filter(Boolean).join(" / ")}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">Stock: {p.currentStock}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : (
        <SaleForm
          product={product}
          onCancel={() => setProduct(null)}
          onCompleted={(sale) => {
            setLastSale(sale);
            setProduct(null);
          }}
        />
      )}
    </div>
  );
}

function SaleConfirmation({ sale, onDismiss }: { sale: SaleDTO; onDismiss: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="text-sm text-emerald-800">
        <p className="font-medium">Sale #{sale.id} completed.</p>
        <p className="mt-0.5">
          Total {formatMoney(sale.totalAmount)} · Paid {formatMoney(sale.amountPaid)}
          {sale.changeAmount > 0 ? ` · Change ${formatMoney(sale.changeAmount)}` : ""}
          {sale.amountDue > 0 ? ` · Due ${formatMoney(sale.amountDue)}` : ""}
        </p>
      </div>
      <button onClick={onDismiss} className="text-xs font-medium text-emerald-700 hover:text-emerald-900">
        Dismiss
      </button>
    </div>
  );
}

function SaleForm({
  product,
  onCancel,
  onCompleted,
}: {
  product: ProductDTO;
  onCancel: () => void;
  onCompleted: (sale: SaleDTO) => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantity) || 0;
  const discountTaka = Number(discount) || 0;
  const totalTaka = Math.max(poishaToTaka(product.sellingPricePoisha) * qty - discountTaka, 0);
  const paidTaka = Number(amountPaid) || 0;
  const dueTaka = Math.max(totalTaka - paidTaka, 0);
  const changeTaka = Math.max(paidTaka - totalTaka, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (qty > product.currentStock) {
      setError(`Only ${product.currentStock} in stock.`);
      return;
    }
    if (Number.isNaN(paidTaka) || paidTaka < 0) {
      setError("Amount paid must be a non-negative number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType,
          amountPaid: takaToPoisha(paidTaka),
          items: [
            {
              productId: product.id,
              quantity: qty,
              discountPoisha: takaToPoisha(discountTaka),
            },
          ],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to complete sale.");
        return;
      }
      onCompleted(body);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{product.name}</p>
          <p className="text-sm text-slate-500">
            {[product.color, product.variant].filter(Boolean).join(" / ") || "—"} ·{" "}
            <Badge variant="neutral">{product.category}</Badge>
          </p>
          <p className="mt-1 text-xs text-slate-500">Barcode: {product.barcodeValue}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-slate-500 hover:text-slate-900">
          Change product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit Price">
          <input disabled value={formatMoney(product.sellingPricePoisha)} className="input bg-slate-50 text-slate-500" />
        </Field>
        <Field label={`Quantity (in stock: ${product.currentStock})`}>
          <input
            type="number"
            min="1"
            step="1"
            max={product.currentStock}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Discount (৳)">
          <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input" />
        </Field>
        <Field label="Payment Type">
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="input">
            {PAYMENT_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {PAYMENT_TYPE_LABELS[pt]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount Paid (৳)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder={totalTaka.toFixed(2)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-3 text-sm">
        <SummaryStat label="Total" value={formatMoney(takaToPoisha(totalTaka))} />
        <SummaryStat label="Due" value={formatMoney(takaToPoisha(dueTaka))} tone={dueTaka > 0 ? "danger" : "default"} />
        <SummaryStat label="Change" value={formatMoney(takaToPoisha(changeTaka))} />
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Completing…" : "Complete Sale"}
        </button>
      </div>
    </form>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 text-base font-semibold ${tone === "danger" ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
