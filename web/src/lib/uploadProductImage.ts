"use client";

import type { ProductDTO } from "./types";

export async function uploadProductImage(productId: number, file: File): Promise<ProductDTO> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/products/${productId}/image`, { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Failed to upload image");
  return body as ProductDTO;
}

export async function removeProductImage(productId: number): Promise<ProductDTO> {
  const res = await fetch(`/api/products/${productId}/image`, { method: "DELETE" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Failed to remove image");
  return body as ProductDTO;
}
