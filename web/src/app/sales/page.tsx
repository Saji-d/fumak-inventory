"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PackageSearch, Receipt, ScanLine, Search, X } from "lucide-react";
import type { ProductDTO, SaleDTO } from "@/lib/types";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, type PaymentType } from "@/lib/types";
import { formatMoney, takaToPoisha, poishaToTaka } from "@/lib/money";
import { BarcodeInput } from "@/components/barcode/BarcodeInput";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { useToast } from "@/components/ui/Toast";

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
        <div className="card flex flex-col gap-5 p-5">
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ScanLine size={15} className="text-slate-400" />
              Scan Barcode
            </h2>
            <BarcodeInput onFound={selectProduct} />
          </div>

          <div className="relative border-t border-slate-100 pt-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Search size={15} className="text-slate-400" />
              Or Search by Name
            </h2>
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Type a product name…"
              className="input"
            />
            {nameResults.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                {nameResults.map((p) => {
                  const style = CATEGORY_STYLES[p.category];
                  const Icon = style.icon;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => selectProduct(p)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-slate-50"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`inline-flex shrink-0 items-center justify-center rounded-md p-1 ${style.chip}`}>
                            <Icon size={12} strokeWidth={2.5} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">{p.name}</span>
                            <span className="text-xs text-slate-500">
                              {[p.color, p.variant].filter(Boolean).join(" / ") || "—"}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">Stock: {p.currentStock}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {nameQuery.trim() && nameResults.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <PackageSearch size={13} />
              No products match &quot;{nameQuery.trim()}&quot;.
            </p>
          ) : null}
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
    <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3 text-sm text-emerald-800">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold">Sale #{sale.id} completed.</p>
          <p className="mt-0.5">
            Total {formatMoney(sale.totalAmount)} · Paid {formatMoney(sale.amountPaid)}
            {sale.changeAmount > 0 ? ` · Change ${formatMoney(sale.changeAmount)}` : ""}
            {sale.amountDue > 0 ? ` · Due ${formatMoney(sale.amountDue)}` : ""}
          </p>
        </div>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="icon-btn shrink-0">
        <X size={15} />
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
  const { toast } = useToast();
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
        toast({ variant: "error", title: "Couldn't complete sale", description: body.error ?? "Please try again." });
        return;
      }
      toast({ variant: "success", title: "Sale completed", description: `Sale #${body.id} · ${formatMoney(body.totalAmount)}` });
      onCompleted(body);
    } catch {
      setError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const categoryStyle = CATEGORY_STYLES[product.category];
  const CategoryIcon = categoryStyle.icon;

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{product.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{[product.color, product.variant].filter(Boolean).join(" / ") || "—"}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
              <CategoryIcon size={11} strokeWidth={2.5} />
              {product.category}
            </span>
          </div>
          <p className="mt-1.5 font-mono text-xs text-slate-400">Barcode: {product.barcodeValue}</p>
        </div>
        <button type="button" onClick={onCancel} className="shrink-0 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          Change product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit Price">
          <input disabled value={formatMoney(product.sellingPricePoisha)} className="input font-mono" />
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

      {/* Checkout summary — the "POS screen" moment, so this needs the strongest visual hierarchy on the page. */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-white">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <Receipt size={14} className="text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Checkout Summary</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/10">
          <SummaryStat label="Total" value={formatMoney(takaToPoisha(totalTaka))} />
          <SummaryStat label="Due" value={formatMoney(takaToPoisha(dueTaka))} tone={dueTaka > 0 ? "danger" : "default"} />
          <SummaryStat label="Change" value={formatMoney(takaToPoisha(changeTaka))} tone={changeTaka > 0 ? "positive" : "default"} />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary px-6">
          {submitting ? "Completing…" : "Complete Sale"}
        </button>
      </div>
    </form>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "positive";
}) {
  const valueClass =
    tone === "danger" ? "text-red-400" : tone === "positive" ? "text-emerald-400" : "text-white";
  return (
    <div className="px-4 py-3.5 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
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
