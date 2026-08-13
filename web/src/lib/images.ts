// Maps a Product's stored R2 object key to the URL the browser should load —
// our own server-side streaming route, never a direct/signed R2 URL. The key
// itself changes on every replace, so embedding it as a query param doubles
// as a cache-buster: the same product id keeps a stable path, but the full
// URL changes whenever the image changes, so long-lived immutable caching
// on the image route is safe.
export function productImageUrl(productId: number, imageKey: string | null): string | null {
  if (!imageKey) return null;
  return `/api/products/${productId}/image?v=${encodeURIComponent(imageKey.slice(-16))}`;
}
