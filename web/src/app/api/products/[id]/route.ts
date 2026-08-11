import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCategory } from "@/lib/types";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}

// PATCH — edit product details. Stock is intentionally NOT editable here;
// stock changes must go through /api/inventory so every change is logged.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { barcodeValue, name, category, color, variant, buyingPricePoisha, sellingPricePoisha, archived } =
    body as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if (barcodeValue !== undefined) {
    if (typeof barcodeValue !== "string" || !barcodeValue.trim()) {
      return NextResponse.json({ error: "barcodeValue must be a non-empty string" }, { status: 400 });
    }
    const dup = await prisma.product.findUnique({ where: { barcodeValue: barcodeValue.trim() } });
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: "A product with this barcode already exists" }, { status: 409 });
    }
    data.barcodeValue = barcodeValue.trim();
  }
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (category !== undefined) {
    if (!isCategory(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = category;
  }
  if (color !== undefined) {
    data.color = typeof color === "string" && color.trim() ? color.trim() : null;
  }
  if (variant !== undefined) {
    data.variant = typeof variant === "string" && variant.trim() ? variant.trim() : null;
  }
  if (buyingPricePoisha !== undefined) {
    if (!Number.isInteger(buyingPricePoisha) || (buyingPricePoisha as number) < 0) {
      return NextResponse.json({ error: "buyingPricePoisha must be a non-negative integer" }, { status: 400 });
    }
    data.buyingPricePoisha = buyingPricePoisha;
  }
  if (sellingPricePoisha !== undefined) {
    if (!Number.isInteger(sellingPricePoisha) || (sellingPricePoisha as number) < 0) {
      return NextResponse.json({ error: "sellingPricePoisha must be a non-negative integer" }, { status: 400 });
    }
    data.sellingPricePoisha = sellingPricePoisha;
  }
  if (archived !== undefined) {
    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "archived must be a boolean" }, { status: 400 });
    }
    data.archived = archived;
  }

  const updated = await prisma.product.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE — "delete" = archive, never a hard delete (sale/inventory history
// references products).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const archived = await prisma.product.update({ where: { id }, data: { archived: true } });
  return NextResponse.json(archived);
}
