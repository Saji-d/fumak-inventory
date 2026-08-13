import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isPaymentType } from "@/lib/types";
import { serializeSale } from "@/lib/serializers";
import { formatMoney } from "@/lib/money";

interface SaleItemInput {
  productId: number;
  quantity: number;
  discountPoisha?: number;
}

// GET /api/sales — recent sales (most recent first).
export async function GET(request: NextRequest) {
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 0, 1), 200) : 20;

  const sales = await prisma.sale.findMany({
    include: {
      items: { include: { product: { select: { id: true, name: true, barcodeValue: true, category: true, color: true, variant: true, imageKey: true } } } },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(sales.map(serializeSale));
}

// POST /api/sales — atomically insert Sale + SaleItem(s), decrement stock,
// and log a SALE inventory transaction per item, all in one prisma.$transaction.
//
// Sales math (implemented exactly as specified):
//   total        = sellingPriceEach * quantity - discount   (summed across items)
//   amountDue    = max(total - amountPaid, 0)
//   changeAmount = max(amountPaid - total, 0)
//
// This app has no credit/partial-payment feature (no customer/debtor tracking,
// no way to later collect an outstanding balance) — so a sale is only allowed to
// complete once amountPaid covers the total. amountDue is therefore expected to
// always be 0 for every sale created here; it's still computed and stored (rather
// than hardcoded) so the formula stays self-evidently correct and consistent with
// how it's read everywhere else. Sales created before this check existed may
// still have a nonzero amountDue — that's real historical data and must not be
// recalculated.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { paymentType, amountPaid, items } = body as Record<string, unknown>;

  if (!isPaymentType(paymentType)) {
    return NextResponse.json({ error: "paymentType must be one of CASH, CARD, MOBILE_MONEY, OTHER" }, { status: 400 });
  }
  if (!Number.isInteger(amountPaid) || (amountPaid as number) < 0) {
    return NextResponse.json({ error: "amountPaid must be a non-negative integer (poisha)" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  }

  const parsedItems: SaleItemInput[] = [];
  for (const raw of items as unknown[]) {
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ error: "Invalid item in items array" }, { status: 400 });
    }
    const { productId, quantity, discountPoisha } = raw as Record<string, unknown>;
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: "Each item needs an integer productId" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
      return NextResponse.json({ error: "Each item needs a positive integer quantity" }, { status: 400 });
    }
    if (discountPoisha !== undefined && (!Number.isInteger(discountPoisha) || (discountPoisha as number) < 0)) {
      return NextResponse.json({ error: "discountPoisha must be a non-negative integer" }, { status: 400 });
    }
    parsedItems.push({
      productId: productId as number,
      quantity: quantity as number,
      discountPoisha: (discountPoisha as number | undefined) ?? 0,
    });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // Aggregate requested quantity per product in case the same
      // product appears more than once in the items array.
      const neededByProduct = new Map<number, number>();
      for (const item of parsedItems) {
        neededByProduct.set(item.productId, (neededByProduct.get(item.productId) ?? 0) + item.quantity);
      }

      const products = await tx.product.findMany({
        where: { id: { in: [...neededByProduct.keys()] } },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      for (const [productId, neededQty] of neededByProduct) {
        const product = productById.get(productId);
        if (!product) {
          throw new SaleError(`Product ${productId} not found`, 404);
        }
        if (neededQty > product.currentStock) {
          throw new SaleError(
            `Not enough stock for "${product.name}" (have ${product.currentStock}, need ${neededQty})`,
            400
          );
        }
      }

      let totalAmount = 0;
      const saleItemsData = parsedItems.map((item) => {
        const product = productById.get(item.productId)!;
        const discount = item.discountPoisha ?? 0;
        const lineTotal = product.sellingPricePoisha * item.quantity - discount;
        totalAmount += lineTotal;
        return {
          productId: product.id,
          quantity: item.quantity,
          sellingPriceEachPoisha: product.sellingPricePoisha,
          buyingCostEachPoisha: product.buyingPricePoisha,
          discountPoisha: discount,
        };
      });

      const paid = amountPaid as number;
      if (paid < totalAmount) {
        throw new SaleError(
          `Amount paid (${formatMoney(paid)}) is less than the total (${formatMoney(totalAmount)}) — short by ${formatMoney(totalAmount - paid)}.`,
          400
        );
      }
      const amountDue = Math.max(totalAmount - paid, 0);
      const changeAmount = Math.max(paid - totalAmount, 0);

      const created = await tx.sale.create({
        data: {
          paymentType,
          totalAmount,
          amountPaid: paid,
          amountDue,
          changeAmount,
          items: { create: saleItemsData },
        },
        include: { items: { include: { product: true } } },
      });

      for (const [productId, neededQty] of neededByProduct) {
        const product = productById.get(productId)!;
        const newStock = product.currentStock - neededQty;
        await tx.product.update({ where: { id: productId }, data: { currentStock: newStock } });
        await tx.inventoryTransaction.create({
          data: {
            productId,
            type: "SALE",
            quantityDelta: -neededQty,
            resultingStock: newStock,
            saleId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json(serializeSale(sale), { status: 201 });
  } catch (err) {
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

class SaleError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
