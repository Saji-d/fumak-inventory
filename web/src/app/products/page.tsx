"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Pencil, Plus, Search } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO, ProductDTO } from "@/lib/types";
import { CATEGORIES, type Category } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { BarcodeInput } from "@/components/barcode/BarcodeInput";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATEGORY_STYLES } from "@/lib/categoryStyles";
import { useToast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/ui/ProductImage";

function StockStatus({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (stock <= threshold) return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [archiveTarget, setArchiveTarget] = useState<ProductDTO | null>(null);
  const [archiving, setArchiving] = useState(false);

  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const threshold = settings?.lowStockThreshold ?? 5;

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category !== "all") params.set("category", category);
    return `/api/products?${params.toString()}`;
  }, [search, category]);

  const { data: products, loading, error, refetch, setData } = useFetch<ProductDTO[]>(url);

  async function confirmArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/products/${archiveTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive product");
      setData((prev) => (prev ? prev.filter((p) => p.id !== archiveTarget.id) : prev));
      toast({ variant: "success", title: "Product archived", description: `"${archiveTarget.name}" was moved out of the active catalog.` });
      setArchiveTarget(null);
    } catch {
      toast({ variant: "error", title: "Couldn't archive product", description: "Please try again." });
      refetch();
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Scan or lookup a barcode</h2>
          <Link href="/products/new" className="btn-primary">
            <Plus size={15} />
            Add Product
          </Link>
        </div>
        <BarcodeInput autoFocus={false} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, barcode, color, or variant…"
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory("all")}
            className={`pill ${category === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => {
            const style = CATEGORY_STYLES[c];
            const Icon = style.icon;
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`pill ${active ? `${style.solid} text-white` : `${style.bg} ${style.text} hover:brightness-95`}`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !products || products.length === 0 ? (
        <EmptyState
          title="No products found"
          description={
            search || category !== "all"
              ? "Try a different search term or category filter."
              : "Get started by adding your first product."
          }
          showLogo={!search && category === "all"}
          action={
            !search && category === "all" ? (
              <Link href="/products/new" className="btn-primary">
                <Plus size={15} />
                Add Product
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Barcode</TableHeaderCell>
                <TableHeaderCell className="text-right">Stock</TableHeaderCell>
                <TableHeaderCell className="text-right">Selling Price</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const style = CATEGORY_STYLES[product.category];
                const Icon = style.icon;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProductImage src={product.imageUrl} alt={product.name} className="h-9 w-9 rounded-md border border-slate-200" iconSize={14} />
                        <div className="min-w-0">
                          <Link href={`/products/${product.id}`} className="font-medium text-slate-900 hover:underline">
                            {product.name}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {[product.color, product.variant].filter(Boolean).join(" / ") || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                        <Icon size={11} strokeWidth={2.5} />
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                        {product.barcodeValue}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-slate-900">{formatNumber(product.currentStock)}</span>
                        <StockStatus stock={product.currentStock} threshold={threshold} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-700">
                      {formatMoney(product.sellingPricePoisha)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors duration-150 hover:text-slate-900"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                        <button
                          onClick={() => setArchiveTarget(product)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:text-red-800"
                        >
                          <Archive size={13} />
                          Archive
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Archive this product?"
        description={
          archiveTarget
            ? `"${archiveTarget.name}" will be hidden from the active catalog. Its sale and inventory history stay intact.`
            : undefined
        }
        confirmLabel="Archive"
        danger
        busy={archiving}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
