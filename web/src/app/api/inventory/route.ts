import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isInventoryTxnType } from "@/lib/types";

// POST /api/inventory — { productId, type: ADD|REMOVE|ADJUST, quantity | newStock, reason? }
// ADD/REMOVE are relative deltas. ADJUST is an ABSOLUTE new stock count —
// quantityDelta is computed server-side as newStock - currentStock.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productId, type, quantity, newStock, reason } = body as Record<string, unknown>;

  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  if (!isInventoryTxnType(type) || type === "SALE") {
    return NextResponse.json({ error: "type must be one of ADD, REMOVE, ADJUST" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId as number } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let quantityDelta: number;
  let resultingStock: number;

  if (type === "ADD") {
    if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
      return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
    }
    quantityDelta = quantity as number;
    resultingStock = product.currentStock + quantityDelta;
  } else if (type === "REMOVE") {
    if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
      return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
    }
    if ((quantity as number) > product.currentStock) {
      return NextResponse.json({ error: "Not enough stock to remove that quantity" }, { status: 400 });
    }
    quantityDelta = -(quantity as number);
    resultingStock = product.currentStock + quantityDelta;
  } else {
    // ADJUST
    if (!Number.isInteger(newStock) || (newStock as number) < 0) {
      return NextResponse.json({ error: "newStock must be a non-negative integer" }, { status: 400 });
    }
    resultingStock = newStock as number;
    quantityDelta = resultingStock - product.currentStock;
  }

  const [, transaction] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { currentStock: resultingStock } }),
    prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type,
        quantityDelta,
        resultingStock,
        reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
      },
    }),
  ]);

  return NextResponse.json(transaction, { status: 201 });
}
