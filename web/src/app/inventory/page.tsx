"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO, InventoryTransactionDTO, ProductDTO } from "@/lib/types";
import { INVENTORY_TXN_TYPE_LABELS, type InventoryTransactionType } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";

const TXN_BADGE_VARIANT: Record<InventoryTransactionType, "success" | "danger" | "info" | "neutral"> = {
  ADD: "success",
  REMOVE: "danger",
  ADJUST: "info",
  SALE: "neutral",
};

export default function InventoryPage() {
  const { data: products, loading: productsLoading, error: productsError, refetch: refetchProducts } =
    useFetch<ProductDTO[]>("/api/products");
  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const {
    data: history,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useFetch<InventoryTransactionDTO[]>("/api/inventory/history");

  const threshold = settings?.lowStockThreshold ?? 5;
  const lowStockProducts = (products ?? []).filter((p) => p.currentStock <= threshold);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Low Stock ({formatNumber(lowStockProducts.length)})
          </h2>
          <span className="text-xs text-slate-500">Threshold: {threshold} units</span>
        </div>
        {productsLoading ? (
          <div className="p-4">
            <LoadingState label="Loading products…" />
          </div>
        ) : productsError ? (
          <div className="p-4">
            <ErrorState message={productsError} onRetry={refetchProducts} />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nothing is low on stock" description="All products are above the low-stock threshold." />
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell className="text-right">Stock</TableHeaderCell>
                <TableHeaderCell className="text-right">Selling Price</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {lowStockProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {[p.color, p.variant].filter(Boolean).join(" / ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.currentStock === 0 ? "danger" : "warning"}>{p.currentStock}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(p.sellingPricePoisha)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Stock Movement History</h2>
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
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Change</TableHeaderCell>
                <TableHeaderCell className="text-right">Resulting Stock</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {history.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{new Date(txn.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    {txn.product ? (
                      <Link href={`/products/${txn.product.id}`} className="font-medium text-slate-900 hover:underline">
                        {txn.product.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TXN_BADGE_VARIANT[txn.type]}>{INVENTORY_TXN_TYPE_LABELS[txn.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
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
