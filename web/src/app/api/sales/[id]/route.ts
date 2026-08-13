import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/sales/[id] — a single sale with its items + products, for the
// receipt view (both the immediate post-checkout receipt and a later
// reprint use this same shape; POST /api/sales already returns it too).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid sale id" }, { status: 400 });

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  return NextResponse.json(sale);
}
