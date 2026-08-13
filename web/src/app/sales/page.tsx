"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { AppSettingsDTO, ProductDTO, SaleDTO } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { ScanPanel } from "@/components/pos/ScanPanel";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutPanel } from "@/components/pos/CheckoutPanel";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import {
  cartReducer,
  clearCartSession,
  EMPTY_CART,
  loadCartFromSession,
  saveCartToSession,
} from "@/lib/pos";

export default function SalesPage() {
  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const currencySymbol = settings?.currencySymbol ?? "৳";
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [lastSale, setLastSale] = useState<SaleDTO | null>(null);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the cart from sessionStorage once on mount, then re-fetch each
  // product so prices/stock reflect the latest server state (not what was
  // true when the cart was last saved).
  useEffect(() => {
    const stored = loadCartFromSession();
    if (stored.length === 0) {
      hydratedRef.current = true;
      setHydrated(true);
      return;
    }
    dispatch({ type: "HYDRATE", lines: stored });
    Promise.all(
      stored.map((line) =>
        fetch(`/api/products/${line.productId}`)
          .then((res) => (res.ok ? (res.json() as Promise<ProductDTO>) : null))
          .catch(() => null)
      )
    ).then((results) => {
      const fresh = results.filter((p): p is ProductDTO => p !== null);
      dispatch({ type: "REFRESH_SNAPSHOTS", products: fresh });
      hydratedRef.current = true;
      setHydrated(true);
    });
  }, []);

  // Persist on every change, but only after the initial hydrate has run —
  // otherwise the empty initial state would overwrite a stored cart before
  // it's loaded.
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveCartToSession(cart.lines);
  }, [cart.lines]);

  function handleAddToCart(product: ProductDTO) {
    dispatch({ type: "ADD_OR_INCREMENT", product });
  }

  function handleCompleted(sale: SaleDTO) {
    setLastSale(sale);
    dispatch({ type: "CLEAR" });
    clearCartSession();
  }

  function handleNewSale() {
    setLastSale(null);
  }

  if (!hydrated) return null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <ScanPanel
          lines={cart.lines}
          lowStockThreshold={lowStockThreshold}
          currencySymbol={currencySymbol}
          onAddToCart={handleAddToCart}
        />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        {lastSale ? (
          <SaleReceipt sale={lastSale} currencySymbol={currencySymbol} showActions onNewSale={handleNewSale} />
        ) : (
          <>
            <CartPanel lines={cart.lines} currencySymbol={currencySymbol} dispatch={dispatch} />
            <CheckoutPanel lines={cart.lines} currencySymbol={currencySymbol} onCompleted={handleCompleted} />
          </>
        )}
      </div>
    </div>
  );
}
