// Framework-free POS cart module — types, reducer, and pure math shared by
// the /sales page's scan/cart/checkout panels. No React, no fetch: this is
// display-side prediction only. The server (api/sales/route.ts) is the
// source of truth for prices and stock at the moment of checkout; the math
// here mirrors its formulas exactly so the on-screen total matches what
// POST /api/sales will actually compute, but a mismatch (e.g. a price
// changed mid-sale) is resolved by trusting the server's response, not by
// reconciling client-side.

import type { ProductDTO, SaleDTO } from "./types";

export interface CartLine {
  productId: number;
  product: ProductDTO;
  quantity: number;
  discountPoisha: number;
}

export interface CartState {
  lines: CartLine[];
}

export type CartAction =
  | { type: "ADD_OR_INCREMENT"; product: ProductDTO; qty?: number }
  | { type: "SET_QUANTITY"; productId: number; quantity: number }
  | { type: "SET_DISCOUNT"; productId: number; discountPoisha: number }
  | { type: "REMOVE"; productId: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; lines: CartLine[] }
  | { type: "REFRESH_SNAPSHOTS"; products: ProductDTO[] };

export const EMPTY_CART: CartState = { lines: [] };

function clampQuantity(quantity: number, product: ProductDTO): number {
  if (!Number.isFinite(quantity)) return 1;
  const clamped = Math.floor(quantity);
  const max = Math.max(product.currentStock, 0);
  if (max <= 0) return Math.max(clamped, 1); // let it through; UI surfaces the stock warning
  return Math.min(Math.max(clamped, 1), max);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_OR_INCREMENT": {
      const qty = action.qty ?? 1;
      const existing = state.lines.find((l) => l.productId === action.product.id);
      if (existing) {
        const nextQty = clampQuantity(existing.quantity + qty, action.product);
        return {
          lines: state.lines.map((l) =>
            l.productId === action.product.id ? { ...l, product: action.product, quantity: nextQty } : l
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          { productId: action.product.id, product: action.product, quantity: clampQuantity(qty, action.product), discountPoisha: 0 },
        ],
      };
    }
    case "SET_QUANTITY": {
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, quantity: clampQuantity(action.quantity, l.product) } : l
        ),
      };
    }
    case "SET_DISCOUNT": {
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId
            ? { ...l, discountPoisha: Math.max(Math.floor(action.discountPoisha) || 0, 0) }
            : l
        ),
      };
    }
    case "REMOVE":
      return { lines: state.lines.filter((l) => l.productId !== action.productId) };
    case "CLEAR":
      return { lines: [] };
    case "HYDRATE":
      return { lines: action.lines };
    case "REFRESH_SNAPSHOTS": {
      const byId = new Map(action.products.map((p) => [p.id, p]));
      return {
        lines: state.lines.map((l) => {
          const fresh = byId.get(l.productId);
          if (!fresh) return l;
          return { ...l, product: fresh, quantity: clampQuantity(l.quantity, fresh) };
        }),
      };
    }
    default:
      return state;
  }
}

/** Remaining units of `product` that can still be added to the cart, given what's already in it. */
export function availableToAdd(product: ProductDTO, lines: CartLine[]): number {
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  return product.currentStock - inCart;
}

function lineGrossPoisha(line: CartLine): number {
  return line.product.sellingPricePoisha * line.quantity;
}

export function lineTotalPoisha(line: CartLine): number {
  return lineGrossPoisha(line) - line.discountPoisha;
}

export interface CartTotals {
  subtotalPoisha: number;
  discountPoisha: number;
  totalPoisha: number;
}

// Mirrors api/sales/route.ts: total = sellingPriceEach*qty - discount, summed.
export function computeCartTotals(lines: CartLine[]): CartTotals {
  let subtotalPoisha = 0;
  let discountPoisha = 0;
  for (const line of lines) {
    subtotalPoisha += lineGrossPoisha(line);
    discountPoisha += line.discountPoisha;
  }
  return { subtotalPoisha, discountPoisha, totalPoisha: subtotalPoisha - discountPoisha };
}

export interface Settlement {
  amountDuePoisha: number;
  changePoisha: number;
}

// Mirrors api/sales/route.ts: amountDue = max(total-paid,0), change = max(paid-total,0).
export function computeSettlement(totalPoisha: number, amountPaidPoisha: number): Settlement {
  return {
    amountDuePoisha: Math.max(totalPoisha - amountPaidPoisha, 0),
    changePoisha: Math.max(amountPaidPoisha - totalPoisha, 0),
  };
}

export function cartToSaleItems(lines: CartLine[]): { productId: number; quantity: number; discountPoisha: number }[] {
  return lines.map((l) => ({ productId: l.productId, quantity: l.quantity, discountPoisha: l.discountPoisha }));
}

/** Derived, human-facing invoice number — no schema change, no separate sequence. */
export function formatInvoiceNo(sale: Pick<SaleDTO, "id" | "timestamp">): string {
  const year = new Date(sale.timestamp).getFullYear();
  return `FUMAK-${year}-${String(sale.id).padStart(6, "0")}`;
}

const CART_STORAGE_KEY = "fumak.pos.cart.v1";

interface StoredCart {
  v: 1;
  lines: CartLine[];
}

export function saveCartToSession(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredCart = { v: 1, lines };
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage unavailable (private mode, quota) — cart just won't persist.
  }
}

export function loadCartFromSession(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart;
    if (parsed?.v !== 1 || !Array.isArray(parsed.lines)) return [];
    return parsed.lines;
  } catch {
    return [];
  }
}

export function clearCartSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}
