"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import type { ProductDTO } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ProductForm } from "@/components/products/ProductForm";

export default function NewProductPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading form…" />}>
      <NewProductPageContent />
    </Suspense>
  );
}

function NewProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBarcode = searchParams.get("barcode") ?? "";

  function handleCreated(product: ProductDTO) {
    router.push(`/products/${product.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <PackagePlus size={17} strokeWidth={2.25} />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">New Product</h2>
        </div>
        <Link href="/products" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900">
          <ArrowLeft size={13} />
          Back to products
        </Link>
      </div>

      <div className="card p-5">
        <ProductForm initialBarcode={prefillBarcode} onCreated={handleCreated} />
      </div>
    </div>
  );
}
