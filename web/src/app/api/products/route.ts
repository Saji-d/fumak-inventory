import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCategory } from "@/lib/types";

// GET /api/products?q=&category=&includeArchived=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const includeArchived = searchParams.get("includeArchived") === "true";

  if (category && !isCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: {
      ...(includeArchived ? {} : { archived: false }),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { barcodeValue: { contains: q } },
              { color: { contains: q } },
              { variant: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products — create a new product
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { barcodeValue, name, category, color, variant, buyingPricePoisha, sellingPricePoisha, currentStock } =
    body as Record<string, unknown>;

  if (typeof barcodeValue !== "string" || !barcodeValue.trim()) {
    return NextResponse.json({ error: "barcodeValue is required" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "category must be one of Clothing, Shoes, Bags, Accessories" }, { status: 400 });
  }
  if (!Number.isInteger(buyingPricePoisha) || (buyingPricePoisha as number) < 0) {
    return NextResponse.json({ error: "buyingPricePoisha must be a non-negative integer" }, { status: 400 });
  }
  if (!Number.isInteger(sellingPricePoisha) || (sellingPricePoisha as number) < 0) {
    return NextResponse.json({ error: "sellingPricePoisha must be a non-negative integer" }, { status: 400 });
  }
  if (!Number.isInteger(currentStock) || (currentStock as number) < 0) {
    return NextResponse.json({ error: "currentStock must be a non-negative integer" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { barcodeValue: barcodeValue.trim() } });
  if (existing) {
    return NextResponse.json({ error: "A product with this barcode already exists" }, { status: 409 });
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        barcodeValue: barcodeValue.trim(),
        name: name.trim(),
        category,
        color: typeof color === "string" && color.trim() ? color.trim() : null,
        variant: typeof variant === "string" && variant.trim() ? variant.trim() : null,
        buyingPricePoisha: buyingPricePoisha as number,
        sellingPricePoisha: sellingPricePoisha as number,
        currentStock: currentStock as number,
      },
    });

    if ((currentStock as number) > 0) {
      await tx.inventoryTransaction.create({
        data: {
          productId: created.id,
          type: "ADD",
          quantityDelta: currentStock as number,
          resultingStock: currentStock as number,
          reason: "Initial stock on product creation",
        },
      });
    }

    return created;
  });

  return NextResponse.json(product, { status: 201 });
}
