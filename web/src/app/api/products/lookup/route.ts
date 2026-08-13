import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serializers";

// GET /api/products/lookup?barcode=... — used by BarcodeInput.
// Looks up regardless of archived status, so re-scanning an archived
// product's barcode still resolves it (rather than reporting "not found").
export async function GET(request: NextRequest) {
  const barcode = new URL(request.url).searchParams.get("barcode")?.trim();
  if (!barcode) {
    return NextResponse.json({ error: "barcode query param is required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { barcodeValue: barcode } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(serializeProduct(product));
}
