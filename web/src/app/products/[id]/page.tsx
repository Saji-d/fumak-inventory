"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  History,
  PackageCheck,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { InventoryTransactionDTO, ProductDTO } from "@/lib/types";
import { CATEGORIES, INVENTORY_TXN_TYPE_LABELS, type Category, type InventoryTransactionType } from "@/lib/types";
import { formatNumber, takaToPoisha, poishaToTaka } from "@/lib/money";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { useToast } from "@/components/ui/Toast";
import { ResumeCartBanner } from "@/components/pos/ResumeCartBanner";

const TXN_BADGE_VARIANT: Record<InventoryTransactionType, "success" | "danger" | "info" | "neutral"> = {
  ADD: "success",
  REMOVE: "danger",
  ADJUST: "info",
  SALE: "neutral",
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const {
    data: product,
    loading,
    error,
    refetch: refetchProduct,
    setData: setProduct,
  } = useFetch<ProductDTO>(Number.isFinite(id) ? `/api/products/${id}` : null);

  const {
    data: history,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useFetch<InventoryTransactionDTO[]>(Number.isFinite(id) ? `/api/inventory/history?productId=${id}` : null);

  if (loading) return <LoadingState label="Loading product…" />;
  if (error) return <ErrorState message={error} onRetry={refetchProduct} />;
  if (!product) return <ErrorState message="Product not found." />;

  return (
    <div className="flex flex-col gap-6">
      <ResumeCartBanner />
      <EditForm product={product} onSaved={setProduct} />
      <StockAdjustPanel
        product={product}
        onAdjusted={() => {
          refetchProduct();
          refetchHistory();
        }}
      />
      <ArchiveSection product={product} onArchived={() => router.push("/products")} />

      <div className="card">
        <div className="card-header">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <History size={15} className="text-slate-400" />
            Inventory History
          </h2>
        </div>
        {historyLoading ? (
          <div className="p-4">
            <LoadingState label="Loading history…" />
          </div>
        ) : historyError ? (
          <div className="p-4">
            <ErrorState message={historyError} onRetry={refetchHistory} />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No stock movements yet" description="Adds, removals, adjustments, and sales will show up here." />
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Change</TableHeaderCell>
                <TableHeaderCell className="text-right">Resulting Stock</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {history.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-slate-500">{new Date(txn.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={TXN_BADGE_VARIANT[txn.type]}>{INVENTORY_TXN_TYPE_LABELS[txn.type]}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-medium ${txn.quantityDelta > 0 ? "text-emerald-700" : txn.quantityDelta < 0 ? "text-red-700" : "text-slate-700"}`}>
                    {txn.quantityDelta > 0 ? `+${txn.quantityDelta}` : txn.quantityDelta}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(txn.resultingStock)}</TableCell>
                  <TableCell className="text-slate-500">{txn.reason ?? (txn.saleId ? `Sale #${txn.saleId}` : "—")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function EditForm({ product, onSaved }: { product: ProductDTO; onSaved: (p: ProductDTO) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState<Category>(product.category);
  const [color, setColor] = useState(product.color ?? "");
  const [variant, setVariant] = useState(product.variant ?? "");
  const [buyingPrice, setBuyingPrice] = useState(String(poishaToTaka(product.buyingPricePoisha)));
  const [sellingPrice, setSellingPrice] = useState(String(poishaToTaka(product.sellingPricePoisha)));
  const [barcodeValue, setBarcodeValue] = useState(product.barcodeValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(product.name);
    setCategory(product.category);
    setColor(product.color ?? "");
    setVariant(product.variant ?? "");
    setBuyingPrice(String(poishaToTaka(product.buyingPricePoisha)));
    setSellingPrice(String(poishaToTaka(product.sellingPricePoisha)));
    setBarcodeValue(product.barcodeValue);
  }, [product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const buying = Number(buyingPrice);
    const selling = Number(sellingPrice);
    if (!name.trim() || !barcodeValue.trim()) {
      setError("Name and barcode are required.");
      return;
    }
    if (Number.isNaN(buying) || buying < 0 || Number.isNaN(selling) || selling < 0) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodeValue: barcodeValue.trim(),
          name: name.trim(),
          category,
          color: color.trim() || null,
          variant: variant.trim() || null,
          buyingPricePoisha: takaToPoisha(buying),
          sellingPricePoisha: takaToPoisha(selling),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to save changes.");
        toast({ variant: "error", title: "Couldn't save changes", description: body.error ?? "Please try again." });
        return;
      }
      onSaved(body);
      setSaved(true);
      toast({ variant: "success", title: "Changes saved", description: `"${name.trim()}" was updated.` });
    } catch {
      setError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const style = CATEGORY_STYLES[product.category];
  const Icon = style.icon;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className={`inline-flex items-center justify-center rounded-lg p-1.5 ${style.chip}`}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
          Product Details
        </h2>
        <Link href="/products" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          <ArrowLeft size={13} />
          Back to products
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Barcode">
            <input value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} className="input font-mono" />
          </Field>
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current Stock (read-only — use adjust panel below)">
            <input value={product.currentStock} disabled className="input" />
          </Field>
          <Field label="Color">
            <input value={color} onChange={(e) => setColor(e.target.value)} className="input" />
          </Field>
          <Field label="Size / Variant">
            <input value={variant} onChange={(e) => setVariant(e.target.value)} className="input" />
          </Field>
          <Field label="Buying Price (৳)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Selling Price (৳)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {saved ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Changes saved.
          </p>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Pencil size={14} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockAdjustPanel({ product, onAdjusted }: { product: ProductDTO; onAdjusted: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState<Extract<InventoryTransactionType, "ADD" | "REMOVE" | "ADJUST">>("ADD");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(amount);
    if (!Number.isInteger(value) || value < 0) {
      setError(type === "ADJUST" ? "New stock must be a non-negative whole number." : "Quantity must be a non-negative whole number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type,
          ...(type === "ADJUST" ? { newStock: value } : { quantity: value }),
          reason: reason.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to update stock.");
        toast({ variant: "error", title: "Couldn't update stock", description: body.error ?? "Please try again." });
        return;
      }
      setAmount("");
      setReason("");
      onAdjusted();
      toast({
        variant: "success",
        title: "Stock updated",
        description:
          type === "ADJUST" ? `Stock set to ${value}.` : `${type === "ADD" ? "Added" : "Removed"} ${value} unit${value === 1 ? "" : "s"}.`,
      });
    } catch {
      setError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <SlidersHorizontal size={15} className="text-slate-400" />
          Adjust Stock
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <PackageCheck size={13} />
          Current: <span className="font-medium text-slate-700">{formatNumber(product.currentStock)}</span>
        </span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="Action">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="input sm:w-40"
          >
            <option value="ADD">Add</option>
            <option value="REMOVE">Remove</option>
            <option value="ADJUST">Set exact stock</option>
          </select>
        </Field>
        <Field label={type === "ADJUST" ? "New Stock Count" : "Quantity"}>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input sm:w-32"
          />
        </Field>
        <Field label="Reason (optional)">
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="input sm:w-56" placeholder="e.g. Restock, damaged" />
        </Field>
        <button type="submit" disabled={submitting} className="btn-primary h-fit">
          {submitting ? "Saving…" : "Apply"}
        </button>
      </form>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

function ArchiveSection({ product, onArchived }: { product: ProductDTO; onArchived: () => void }) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (product.archived) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Archive size={16} className="shrink-0" />
        This product is archived and hidden from the active catalog.
      </div>
    );
  }

  async function handleArchive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ variant: "success", title: "Product archived", description: `"${product.name}" was moved out of the active catalog.` });
        onArchived();
      } else {
        toast({ variant: "error", title: "Couldn't archive product", description: "Please try again." });
      }
    } catch {
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="card flex items-center justify-between gap-4 px-4 py-3.5">
      <p className="text-sm text-slate-600">Archiving hides this product from the active catalog without deleting its history.</p>
      <button onClick={() => setConfirmOpen(true)} className="btn-danger-outline shrink-0">
        <Archive size={14} />
        Archive Product
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Archive this product?"
        description={`"${product.name}" will be hidden from the active catalog. Its sale and inventory history stay intact.`}
        confirmLabel="Archive"
        danger
        busy={busy}
        onConfirm={handleArchive}
        onCancel={() => setConfirmOpen(false)}
      />
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
