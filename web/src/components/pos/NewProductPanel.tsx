"use client";

import { PackagePlus, X } from "lucide-react";
import type { ProductDTO } from "@/lib/types";
import { ProductForm } from "@/components/products/ProductForm";

/**
 * The persistent "New Product Detected" state — shown in place of the scan
 * result when a barcode doesn't resolve. Stays up until the cashier
 * registers the product or cancels; never a transient/auto-dismissing
 * notification. On success the caller transitions straight to
 * ProductFoundCard for the new product (no re-scan needed).
 */
export function NewProductPanel({
  barcode,
  onCreated,
  onCancel,
}: {
  barcode: string;
  onCreated: (product: ProductDTO) => void;
  onCancel: () => void;
}) {
  return (
    <div className="card overflow-hidden border-amber-200">
      <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/60 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
          <PackagePlus size={14} />
          New Product Detected
        </span>
        <button onClick={onCancel} aria-label="Dismiss" className="icon-btn">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-slate-600">
          Barcode <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{barcode}</span> isn&apos;t
          in the catalog yet. Register it below to add it to the cart immediately.
        </p>

        <ProductForm
          initialBarcode={barcode}
          lockBarcode
          defaultStock="1"
          submitLabel="Register & Continue"
          dense
          onCreated={onCreated}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
