"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type ProductDTO } from "@/lib/types";
import { takaToPoisha } from "@/lib/money";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { useToast } from "@/components/ui/Toast";

/**
 * The product-registration form body, shared by the standalone
 * /products/new page and the POS's inline "New Product Detected" panel so
 * there is exactly one implementation to keep in sync with the API.
 */
export function ProductForm({
  initialBarcode = "",
  lockBarcode = false,
  defaultStock = "0",
  submitLabel = "Save Product",
  dense = false,
  onCreated,
  onCancel,
}: {
  initialBarcode?: string;
  lockBarcode?: boolean;
  defaultStock?: string;
  submitLabel?: string;
  dense?: boolean;
  onCreated: (product: ProductDTO) => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [barcodeValue, setBarcodeValue] = useState(initialBarcode);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Clothing");
  const [color, setColor] = useState("");
  const [variant, setVariant] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [currentStock, setCurrentStock] = useState(defaultStock);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const buying = Number(buyingPrice);
    const selling = Number(sellingPrice);
    const stock = Number(currentStock);

    if (!barcodeValue.trim() || !name.trim()) {
      setError("Barcode and name are required.");
      return;
    }
    if (Number.isNaN(buying) || buying < 0 || Number.isNaN(selling) || selling < 0) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Initial stock must be a non-negative whole number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodeValue: barcodeValue.trim(),
          name: name.trim(),
          category,
          color: color.trim() || undefined,
          variant: variant.trim() || undefined,
          buyingPricePoisha: takaToPoisha(buying),
          sellingPricePoisha: takaToPoisha(selling),
          currentStock: stock,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to create product.");
        toast({ variant: "error", title: "Couldn't create product", description: body.error ?? "Please check the form and try again." });
        return;
      }
      toast({ variant: "success", title: "Product created", description: `"${name.trim()}" was added to the catalog.` });
      onCreated(body as ProductDTO);
    } catch {
      setError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const gap = dense ? "gap-3" : "gap-4";

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col ${gap}`}>
      <Field label="Barcode" required>
        <input
          value={barcodeValue}
          onChange={(e) => setBarcodeValue(e.target.value)}
          disabled={lockBarcode}
          className="input font-mono"
          placeholder="e.g. 8901030895567"
        />
      </Field>

      <Field label="Name" required>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. T-Shirt" autoFocus={dense} />
      </Field>

      <Field label="Category" required>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const style = CATEGORY_STYLES[c];
            const Icon = style.icon;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`pill ${active ? `${style.solid} text-white` : `${style.bg} ${style.text} hover:brightness-95`}`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {c}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Color">
          <input value={color} onChange={(e) => setColor(e.target.value)} className="input" placeholder="e.g. Black" />
        </Field>
        <Field label="Size / Variant">
          <input value={variant} onChange={(e) => setVariant(e.target.value)} className="input" placeholder="e.g. XL" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Buying Price (৳)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </Field>
        <Field label="Selling Price (৳)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </Field>
      </div>

      <Field label="Initial Stock" required>
        <input
          type="number"
          min="0"
          step="1"
          value={currentStock}
          onChange={(e) => setCurrentStock(e.target.value)}
          className="input"
        />
      </Field>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
