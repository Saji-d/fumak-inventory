"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/types";
import { takaToPoisha } from "@/lib/money";
import { LoadingState } from "@/components/ui/LoadingState";

export default function NewProductPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading form…" />}>
      <NewProductForm />
    </Suspense>
  );
}

function NewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBarcode = searchParams.get("barcode") ?? "";

  const [barcodeValue, setBarcodeValue] = useState(prefillBarcode);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Clothing");
  const [color, setColor] = useState("");
  const [variant, setVariant] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
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
        return;
      }
      router.push(`/products/${body.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">New Product</h2>
        <Link href="/products" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          ← Back to products
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Field label="Barcode" required>
          <input
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            className="input"
            placeholder="e.g. 8901030895567"
          />
        </Field>

        <Field label="Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. T-Shirt" />
        </Field>

        <Field label="Category" required>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/products"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
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
