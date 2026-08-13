"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { validateImageFile } from "@/lib/imageValidation";
import { uploadProductImage, removeProductImage } from "@/lib/uploadProductImage";
import type { ProductDTO } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

/**
 * Optional product-photo control, shared by product creation and editing.
 *
 * Two modes, switched on whether `productId` is known yet:
 *  - Edit mode (productId set): a selected file uploads immediately via
 *    POST /api/products/[id]/image; the card reflects the server's result.
 *  - Create mode (no productId): there's no product to attach the image to
 *    yet, so the file is just staged locally (preview + onFileSelected) —
 *    the caller uploads it after the product is created.
 */
export function ProductImageField({
  productId,
  imageUrl,
  onFileSelected,
  onChanged,
}: {
  productId?: number;
  imageUrl?: string | null;
  onFileSelected?: (file: File | null) => void;
  onChanged?: (product: ProductDTO) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl ?? null);
  }, [imageUrl]);

  async function handleFile(file: File | null) {
    setError(null);

    if (!file) {
      if (productId) {
        setBusy(true);
        try {
          const updated = await removeProductImage(productId);
          setPreviewUrl(null);
          onChanged?.(updated);
          toast({ variant: "success", title: "Image removed" });
        } catch (err) {
          toast({ variant: "error", title: "Couldn't remove image", description: err instanceof Error ? err.message : undefined });
        } finally {
          setBusy(false);
        }
      } else {
        setPreviewUrl(null);
        onFileSelected?.(null);
      }
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));

    if (productId) {
      setBusy(true);
      try {
        const updated = await uploadProductImage(productId, file);
        setPreviewUrl(updated.imageUrl);
        onChanged?.(updated);
        toast({ variant: "success", title: "Image updated" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
        setPreviewUrl(imageUrl ?? null);
      } finally {
        setBusy(false);
      }
    } else {
      onFileSelected?.(file);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ProductImage src={previewUrl} alt="Product" className="h-20 w-20 rounded-xl border border-slate-200" iconSize={24} />
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-secondary px-2.5 py-1.5 text-xs">
            <Camera size={13} />
            {previewUrl ? "Replace photo" : "Upload photo"}
          </button>
          {previewUrl ? (
            <button type="button" onClick={() => handleFile(null)} disabled={busy} className="btn-danger-outline text-xs">
              <Trash2 size={13} />
              Remove
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-slate-400">Optional · JPG, PNG, or WEBP · up to 5MB</p>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
