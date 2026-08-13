"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import type { AppSettingsDTO, SaleDTO } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { SaleDetailCard } from "@/components/pos/SaleDetailCard";

export default function SaleReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const {
    data: sale,
    loading,
    error,
    refetch,
  } = useFetch<SaleDTO>(Number.isFinite(id) ? `/api/sales/${id}` : null);
  const { data: settings } = useFetch<AppSettingsDTO>("/api/settings");
  const currencySymbol = settings?.currencySymbol ?? "৳";

  if (loading) return <LoadingState label="Loading receipt…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!sale) return <ErrorState message="Sale not found." />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="no-print flex items-center justify-between gap-3">
        <Link href="/sales" className="inline-flex w-fit items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          <ArrowLeft size={13} />
          Back to POS
        </Link>
        <Link href="/sales/history" className="inline-flex w-fit items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          Sales History
        </Link>
      </div>
      <SaleDetailCard sale={sale} currencySymbol={currencySymbol} />
      <SaleReceipt sale={sale} currencySymbol={currencySymbol} showActions hideOpenFullReceiptLink />
    </div>
  );
}
