// Converts raw Prisma rows into the DTO shapes returned over the API —
// specifically, replaces the internal Product.imageKey (an R2 object key)
// with the public imageUrl the browser can actually load. Nothing else
// transforms the row; NextResponse.json() takes care of Date -> ISO string.
//
// Generics are constrained to "has id + imageKey" rather than the full
// Prisma Product type, since several endpoints select only a subset of
// product columns (e.g. sale item listings).

import { productImageUrl } from "./images";

interface ProductLike {
  id: number;
  imageKey: string | null;
  [key: string]: unknown;
}

export function serializeProduct<T extends ProductLike>(product: T) {
  const { imageKey, ...rest } = product;
  return { ...rest, imageUrl: productImageUrl(product.id, imageKey) };
}

interface SaleItemWithOptionalProduct {
  product?: ProductLike | null;
  [key: string]: unknown;
}

export function serializeSaleItem<T extends SaleItemWithOptionalProduct>(item: T) {
  if (!item.product) return item;
  return { ...item, product: serializeProduct(item.product) };
}

interface SaleWithItems {
  items: SaleItemWithOptionalProduct[];
  [key: string]: unknown;
}

export function serializeSale<T extends SaleWithItems>(sale: T) {
  return { ...sale, items: sale.items.map(serializeSaleItem) };
}
