"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { computeCartTotals, loadCartFromSession, type CartLine } from "@/lib/pos";

/**
 * Shown on the product detail page when a non-empty POS cart exists in
 * sessionStorage, so [View Product] is a round trip back to the in-progress
 * sale rather than a dead end. Reads sessionStorage only in an effect
 * (never during render) to avoid a server/client hydration mismatch.
 */
export function ResumeCartBanner() {
  const [lines, setLines] = useState<CartLine[] | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => setLines(loadCartFromSession()));
  }, []);

  if (!lines || lines.length === 0) return null;

  const { totalPoisha } = computeCartTotals(lines);

  return (
    <Link
      href="/sales"
      className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800 transition-colors duration-150 hover:bg-indigo-100"
    >
      <span className="flex items-center gap-2">
        <ShoppingCart size={15} />
        Sale in progress · {lines.length} item{lines.length === 1 ? "" : "s"} · {formatMoney(totalPoisha)}
      </span>
      <span className="shrink-0 font-medium">Return to checkout →</span>
    </Link>
  );
}
