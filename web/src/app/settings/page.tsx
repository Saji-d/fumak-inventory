"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Save, Settings as SettingsIcon, TriangleAlert } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
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
        toast({ variant: "error", title: "Couldn't save settings", description: body.error ?? "Please try again." });
        return;
      }
      setData(body);
      setSaved(true);
      toast({ variant: "success", title: "Settings saved" });
    } catch {
      setSaveError("Network error. Please try again.");
      toast({ variant: "error", title: "Network error", description: "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-1.5 text-slate-600">
            <SettingsIcon size={15} strokeWidth={2.25} />
          </span>
          Shop Settings
        </h2>

        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <TriangleAlert size={13} className="text-amber-500" />
            Low Stock Threshold
          </span>
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
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <CircleDollarSign size={13} className="text-slate-400" />
            Currency Symbol
          </span>
          <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className="input" />
        </label>

        {saveError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
        ) : null}
        {saved ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Settings saved.
          </p>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={14} />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
