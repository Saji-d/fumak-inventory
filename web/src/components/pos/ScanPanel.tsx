"use client";

import { useEffect, useRef, useState } from "react";
import { PackageSearch, ScanLine, Search } from "lucide-react";
import type { ProductDTO } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { BarcodeInput, type BarcodeInputHandle } from "@/components/barcode/BarcodeInput";
import { ProductFoundCard } from "./ProductFoundCard";
import { NewProductPanel } from "./NewProductPanel";
import type { CartLine } from "@/lib/pos";
import { useScannerEvents } from "@/lib/useScannerEvents";
import { Badge } from "@/components/ui/Badge";

type ScanState = { kind: "idle" } | { kind: "found"; product: ProductDTO } | { kind: "unknown"; barcode: string };

/**
 * Owns the scan-result state machine. A new scan while a Found/New-Product
 * state is showing REPLACES it (never silently adds, never gets ignored) —
 * the barcode input itself stays empty and focused in every state, so a
 * scanner trigger-pull always lands somewhere useful.
 */
export function ScanPanel({
  lines,
  lowStockThreshold,
  currencySymbol,
  onAddToCart,
}: {
  lines: CartLine[];
  lowStockThreshold: number;
  currencySymbol: string;
  onAddToCart: (product: ProductDTO) => void;
}) {
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });
  const [nameQuery, setNameQuery] = useState("");
  const [nameResults, setNameResults] = useState<ProductDTO[]>([]);
  const barcodeRef = useRef<BarcodeInputHandle>(null);

  // Barcodes pushed by the Android scanner are fed through the exact same
  // BarcodeInput.submit() path a manual/keyboard scan already takes — no separate
  // lookup logic here.
  const { connected: scannerConnected } = useScannerEvents((barcode) => {
    barcodeRef.current?.submit(barcode);
  });

  useEffect(() => {
    const query = nameQuery.trim();
    if (!query) return;
    const timeout = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: ProductDTO[]) => setNameResults(data.slice(0, 6)))
        .catch(() => setNameResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [nameQuery]);

  function selectProduct(p: ProductDTO) {
    setScanState({ kind: "found", product: p });
    setNameQuery("");
    setNameResults([]);
  }

  function handleAddToCart(product: ProductDTO) {
    onAddToCart(product);
    setScanState({ kind: "idle" });
    barcodeRef.current?.focus();
  }

  function handleDismiss() {
    setScanState({ kind: "idle" });
    barcodeRef.current?.focus();
  }

  function handleProductCreated(product: ProductDTO) {
    // Land on the normal Found card so [Add to Cart] is immediately live —
    // no re-scan, no redirect needed.
    setScanState({ kind: "found", product });
  }

  function handleEmptyEnter() {
    // A real scanner always types digits before Enter, so this path can
    // only be triggered by a human keystroke — safe to treat as "confirm".
    if (scanState.kind === "found") {
      handleAddToCart(scanState.product);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ScanLine size={15} className="text-slate-400" />
            Scan Barcode
          </h2>
          <Badge variant={scannerConnected ? "success" : "neutral"}>
            {scannerConnected ? "FUMAK Scanner Connected" : "FUMAK Scanner Disconnected"}
          </Badge>
        </div>
        <BarcodeInput
          ref={barcodeRef}
          onFound={(product) => setScanState({ kind: "found", product })}
          onNotFound={(barcode) => setScanState({ kind: "unknown", barcode })}
          onEmptyEnter={handleEmptyEnter}
        />
      </div>

      {scanState.kind === "found" ? (
        <ProductFoundCard
          product={scanState.product}
          lines={lines}
          lowStockThreshold={lowStockThreshold}
          currencySymbol={currencySymbol}
          onAddToCart={handleAddToCart}
          onDismiss={handleDismiss}
        />
      ) : scanState.kind === "unknown" ? (
        <NewProductPanel barcode={scanState.barcode} onCreated={handleProductCreated} onCancel={handleDismiss} />
      ) : (
        <div className="card p-4">
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
          {nameQuery.trim() && nameResults.length > 0 ? (
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
          {nameQuery.trim() && nameResults.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <PackageSearch size={13} />
              No products match &quot;{nameQuery.trim()}&quot;.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
