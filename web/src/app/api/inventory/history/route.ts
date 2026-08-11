import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/inventory/history?productId= — omit productId for all-products history.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productIdParam = searchParams.get("productId");
  const limitParam = searchParams.get("limit");

  const where: { productId?: number } = {};
  if (productIdParam) {
    const productId = Number(productIdParam);
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    where.productId = productId;
  }

  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 0, 1), 500) : 100;

  const transactions = await prisma.inventoryTransaction.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, barcodeValue: true, category: true, color: true, variant: true },
      },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}
