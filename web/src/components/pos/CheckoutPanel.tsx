"use client";

import { useRef, useState } from "react";
import { Receipt, TriangleAlert } from "lucide-react";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, type PaymentType, type SaleDTO } from "@/lib/types";
import { formatMoney, poishaToTaka, takaToPoisha } from "@/lib/money";
import { useToast } from "@/components/ui/Toast";
import { cartToSaleItems, computeCartTotals, computeSettlement, type CartLine } from "@/lib/pos";

export function CheckoutPanel({
  lines,
  currencySymbol,
  onCompleted,
}: {
  lines: CartLine[];
  currencySymbol: string;
  onCompleted: (sale: SaleDTO) => void;
}) {
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { subtotalPoisha, discountPoisha, totalPoisha } = computeCartTotals(lines);
  const paidTaka = Number(amountPaid) || 0;
  const paidPoisha = takaToPoisha(paidTaka);
  // amountDuePoisha here means "how much more is needed to reach the total" — a
  // live shortfall while the cashier is typing, not a stored customer debt. This
  // app has no credit/partial-payment feature, so a shortfall blocks checkout
  // entirely (see canSubmit/handleCheckout below) rather than being allowed
  // through as an "amount due" balance.
  const { amountDuePoisha: shortfallPoisha, changePoisha } = computeSettlement(totalPoisha, paidPoisha);
  const totalTaka = poishaToTaka(totalPoisha);

  const hasStockConflict = lines.some((l) => l.quantity > l.product.currentStock);
  const canSubmit = lines.length > 0 && !hasStockConflict && shortfallPoisha === 0;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (submittingRef.current) return;
    if (lines.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (hasStockConflict) {
      setError("Some items exceed available stock. Adjust quantities before checkout.");
      return;
    }
    if (Number.isNaN(paidTaka) || paidTaka < 0) {
      setError("Amount paid must be a non-negative number.");
      return;
    }
    if (shortfallPoisha > 0) {
      setError(`Amount paid is short by ${formatMoney(shortfallPoisha, currencySymbol)}.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType,
          amountPaid: paidPoisha,
          items: cartToSaleItems(lines),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to complete sale.");
        toast({ variant: "error", title: "Couldn't complete sale", description: body.error ?? "Please try again." });
        return;
      }
      toast({ variant: "success", title: "Sale completed", description: `Sale #${body.id} · ${formatMoney(body.totalAmount, currencySymbol)}` });
      onCompleted(body as SaleDTO);
    } catch {
      setError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleCheckout} className="card flex flex-col gap-4 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Receipt size={15} className="text-slate-400" />
        Checkout
      </h2>

      <div className="grid grid-cols-2 gap-3">
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
          <div className="flex gap-1.5">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={totalTaka.toFixed(2)}
              className="input"
            />
            <button type="button" onClick={() => setAmountPaid(totalTaka.toFixed(2))} className="btn-secondary shrink-0 px-2.5 text-xs">
              Exact
            </button>
          </div>
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-white">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <Receipt size={14} className="text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Checkout Summary</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/10">
          <SummaryStat label="Subtotal" value={formatMoney(subtotalPoisha, currencySymbol)} />
          <SummaryStat label="Discount" value={formatMoney(discountPoisha, currencySymbol)} />
          <SummaryStat label="Total" value={formatMoney(totalPoisha, currencySymbol)} />
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
          <SummaryStat label="Amount Paid" value={formatMoney(paidPoisha, currencySymbol)} />
          <SummaryStat label="Change" value={formatMoney(changePoisha, currencySymbol)} tone={changePoisha > 0 ? "positive" : "default"} />
        </div>
      </div>

      {shortfallPoisha > 0 && lines.length > 0 ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          {formatMoney(shortfallPoisha, currencySymbol)} more needed to complete this sale.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button type="submit" disabled={!canSubmit || submitting} className="btn-primary w-full py-2.5">
        {submitting ? "Completing…" : "Complete Sale"}
      </button>
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
    <div className="min-w-0 px-2 py-3.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 truncate font-mono text-sm font-bold tabular-nums ${valueClass}`} title={value}>
        {value}
      </p>
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
