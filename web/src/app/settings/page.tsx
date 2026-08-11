"use client";

import { useEffect, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function SettingsPage() {
  const { data: settings, loading, error, refetch, setData } = useFetch<AppSettingsDTO>("/api/settings");

  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [currencySymbol, setCurrencySymbol] = useState("৳");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setLowStockThreshold(String(settings.lowStockThreshold));
      setCurrencySymbol(settings.currencySymbol);
    }
  }, [settings]);

  if (loading) return <LoadingState label="Loading settings…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    const threshold = Number(lowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      setSaveError("Low stock threshold must be a non-negative whole number.");
      return;
    }
    if (!currencySymbol.trim()) {
      setSaveError("Currency symbol is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowStockThreshold: threshold, currencySymbol: currencySymbol.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSaveError(body.error ?? "Failed to save settings.");
        return;
      }
      setData(body);
      setSaved(true);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Shop Settings</h2>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Low Stock Threshold</span>
          <input
            type="number"
            min="0"
            step="1"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            className="input"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Products at or below this stock count are flagged as low stock.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Currency Symbol</span>
          <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className="input" />
        </label>

        {saveError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
        ) : null}
        {saved ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Settings saved.
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
