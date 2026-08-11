"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import type { ProductDTO } from "@/lib/types";
import { CATEGORIES, type Category } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { BarcodeInput } from "@/components/barcode/BarcodeInput";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [archiveTarget, setArchiveTarget] = useState<ProductDTO | null>(null);
  const [archiving, setArchiving] = useState(false);

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
      setArchiveTarget(null);
    } catch {
      refetch();
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Scan or lookup a barcode</h2>
          <Link
            href="/products/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            + Add Product
          </Link>
        </div>
        <BarcodeInput autoFocus={false} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, barcode, color, or variant…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                category === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
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
          action={
            !search && category === "all" ? (
              <Link
                href="/products/new"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add Product
              </Link>
            ) : undefined
          }
        />
      ) : (
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
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Link href={`/products/${product.id}`} className="font-medium text-slate-900 hover:underline">
                    {product.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {[product.color, product.variant].filter(Boolean).join(" / ") || "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">{product.barcodeValue}</TableCell>
                <TableCell className="text-right">{formatNumber(product.currentStock)}</TableCell>
                <TableCell className="text-right">{formatMoney(product.sellingPricePoisha)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/products/${product.id}`} className="text-xs font-medium text-slate-600 hover:text-slate-900">
                      Edit
                    </Link>
                    <button
                      onClick={() => setArchiveTarget(product)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Archive
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
