"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanLine, Search, TriangleAlert } from "lucide-react";
import type { ProductDTO } from "@/lib/types";

/**
 * A single auto-focused <input> that submits on Enter — the universal
 * USB/Bluetooth scanner keyboard-wedge behavior. No timing tricks needed:
 * scanners simply type the barcode digits followed by an Enter keystroke.
 *
 * On submit: GET /api/products/lookup?barcode=<value>.
 *  - Found: calls onFound(product) if provided, otherwise navigates to
 *    /products/[id].
 *  - Not found: shows an inline "Product not found" message with a
 *    "Register Product" link to /products/new?barcode=<value>.
 */
export function BarcodeInput({
  onFound,
  autoFocus = true,
  placeholder = "Scan or type a barcode, then press Enter",
  className = "",
}: {
  onFound?: (product: ProductDTO) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const barcode = value.trim();
    if (!barcode) return;

    setLoading(true);
    setError(null);
    setNotFoundBarcode(null);

    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(barcode)}`);
      if (res.status === 404) {
        setNotFoundBarcode(barcode);
        return;
      }
      if (!res.ok) {
        setError("Lookup failed. Please try again.");
        return;
      }
      const product = (await res.json()) as ProductDTO;
      setValue("");
      if (onFound) {
        onFound(product);
      } else {
        router.push(`/products/${product.id}`);
      }
    } catch {
      setError("Network error while looking up barcode.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (notFoundBarcode) setNotFoundBarcode(null);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            aria-label="Barcode"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={handleSubmit} disabled={loading || !value.trim()} className="btn-primary shrink-0">
          <Search size={15} />
          {loading ? "Looking up…" : "Lookup"}
        </button>
      </div>

      {notFoundBarcode ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <TriangleAlert size={16} className="shrink-0 text-amber-600" />
          <span>
            Product not found for barcode <strong>{notFoundBarcode}</strong>.
          </span>
          <Link
            href={`/products/new?barcode=${encodeURIComponent(notFoundBarcode)}`}
            className="ml-auto shrink-0 rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-amber-700"
          >
            Register Product
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
