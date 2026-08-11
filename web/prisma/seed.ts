import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

interface ProductSeed {
  barcode: string;
  name: string;
  category: "Clothing" | "Shoes" | "Bags" | "Accessories";
  color: string;
  variant: string;
  buying: number; // poisha
  selling: number; // poisha
  targetStock: number; // desired currentStock after demo sales are applied
}

const PRODUCTS: ProductSeed[] = [
  { barcode: "8901030895567", name: "T-Shirt", category: "Clothing", color: "Black", variant: "XL", buying: 35000, selling: 55000, targetStock: 40 },
  { barcode: "8901030895574", name: "T-Shirt", category: "Clothing", color: "White", variant: "L", buying: 32000, selling: 52000, targetStock: 35 },
  { barcode: "8901030895581", name: "Denim Jeans", category: "Clothing", color: "Blue", variant: "32", buying: 90000, selling: 145000, targetStock: 25 },
  { barcode: "8901030895598", name: "Polo Shirt", category: "Clothing", color: "Navy", variant: "M", buying: 45000, selling: 75000, targetStock: 30 },
  { barcode: "8901030895604", name: "Running Shoes", category: "Shoes", color: "Black", variant: "42", buying: 180000, selling: 290000, targetStock: 18 },
  { barcode: "8901030895611", name: "Sandals", category: "Shoes", color: "Brown", variant: "41", buying: 65000, selling: 110000, targetStock: 22 },
  { barcode: "8901030895628", name: "Leather Loafers", category: "Shoes", color: "Tan", variant: "43", buying: 220000, selling: 350000, targetStock: 12 },
  { barcode: "8901030895635", name: "Tote Bag", category: "Bags", color: "Beige", variant: "Standard", buying: 75000, selling: 130000, targetStock: 15 },
  { barcode: "8901030895642", name: "Backpack", category: "Bags", color: "Black", variant: "Standard", buying: 95000, selling: 160000, targetStock: 20 },
  { barcode: "8901030895659", name: "Leather Belt", category: "Accessories", color: "Brown", variant: "34", buying: 25000, selling: 45000, targetStock: 3 },
  { barcode: "8901030895666", name: "Sunglasses", category: "Accessories", color: "Black", variant: "Standard", buying: 40000, selling: 85000, targetStock: 28 },
  { barcode: "8901030895673", name: "Wrist Watch", category: "Accessories", color: "Silver", variant: "Standard", buying: 150000, selling: 280000, targetStock: 10 },
];

interface SaleItemSeed {
  productIndex: number;
  quantity: number;
  discount: number; // poisha
}

interface SaleSeed {
  daysAgo: number;
  paymentType: "CASH" | "CARD" | "MOBILE_MONEY" | "OTHER";
  items: SaleItemSeed[];
  amountPaidAdjustment?: number; // poisha, added to total to simulate over/under payment
}

const SALES: SaleSeed[] = [
  {
    daysAgo: 120,
    paymentType: "CASH",
    items: [
      { productIndex: 0, quantity: 2, discount: 0 },
      { productIndex: 9, quantity: 1, discount: 0 },
    ],
  },
  {
    daysAgo: 95,
    paymentType: "CARD",
    items: [{ productIndex: 4, quantity: 1, discount: 5000 }],
  },
  {
    daysAgo: 60,
    paymentType: "MOBILE_MONEY",
    items: [
      { productIndex: 7, quantity: 1, discount: 0 },
      { productIndex: 10, quantity: 2, discount: 0 },
    ],
  },
  {
    daysAgo: 30,
    paymentType: "CASH",
    items: [{ productIndex: 2, quantity: 1, discount: 0 }],
    amountPaidAdjustment: -20000, // customer still owes 200 taka
  },
  {
    daysAgo: 10,
    paymentType: "CASH",
    items: [
      { productIndex: 5, quantity: 1, discount: 0 },
      { productIndex: 3, quantity: 1, discount: 0 },
    ],
    amountPaidAdjustment: 10000, // customer paid with a larger note, gets change
  },
  {
    daysAgo: 0,
    paymentType: "CARD",
    items: [{ productIndex: 1, quantity: 3, discount: 5000 }],
  },
];

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("Seeding FUMAK database...");

  // AppSettings singleton row.
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lowStockThreshold: 5, currencySymbol: "৳" },
  });

  // Total quantity sold per product across the demo sales, so we can
  // compute an opening stock that nets down to the desired targetStock.
  const soldByProduct = new Map<number, number>();
  for (const sale of SALES) {
    for (const item of sale.items) {
      soldByProduct.set(
        item.productIndex,
        (soldByProduct.get(item.productIndex) ?? 0) + item.quantity
      );
    }
  }

  const createdProductIds: number[] = [];
  const runningStock: number[] = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const openingStock = p.targetStock + (soldByProduct.get(i) ?? 0);

    const product = await prisma.product.create({
      data: {
        barcodeValue: p.barcode,
        name: p.name,
        category: p.category,
        color: p.color,
        variant: p.variant,
        buyingPricePoisha: p.buying,
        sellingPricePoisha: p.selling,
        currentStock: openingStock,
      },
    });
    createdProductIds.push(product.id);
    runningStock.push(openingStock);

    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: "ADD",
        quantityDelta: openingStock,
        resultingStock: openingStock,
        reason: "Initial stock intake",
        timestamp: daysAgoDate(150),
      },
    });
  }

  // Process sales oldest-first so resultingStock snapshots read correctly.
  const orderedSales = [...SALES].sort((a, b) => b.daysAgo - a.daysAgo);

  for (const saleSeed of orderedSales) {
    const timestamp = daysAgoDate(saleSeed.daysAgo);

    let totalAmount = 0;
    const itemsData = saleSeed.items.map((item) => {
      const product = PRODUCTS[item.productIndex];
      const lineTotal = product.selling * item.quantity - item.discount;
      totalAmount += lineTotal;
      return {
        productId: createdProductIds[item.productIndex],
        quantity: item.quantity,
        sellingPriceEachPoisha: product.selling,
        buyingCostEachPoisha: product.buying,
        discountPoisha: item.discount,
      };
    });

    const amountPaid = Math.max(totalAmount + (saleSeed.amountPaidAdjustment ?? 0), 0);
    const amountDue = Math.max(totalAmount - amountPaid, 0);
    const changeAmount = Math.max(amountPaid - totalAmount, 0);

    const sale = await prisma.sale.create({
      data: {
        timestamp,
        paymentType: saleSeed.paymentType,
        totalAmount,
        amountPaid,
        amountDue,
        changeAmount,
        items: { create: itemsData },
      },
    });

    for (const item of saleSeed.items) {
      runningStock[item.productIndex] -= item.quantity;
      const newStock = runningStock[item.productIndex];

      await prisma.inventoryTransaction.create({
        data: {
          productId: createdProductIds[item.productIndex],
          type: "SALE",
          quantityDelta: -item.quantity,
          resultingStock: newStock,
          saleId: sale.id,
          timestamp,
        },
      });

      await prisma.product.update({
        where: { id: createdProductIds[item.productIndex] },
        data: { currentStock: newStock },
      });
    }
  }

  console.log(`Seeded ${PRODUCTS.length} products and ${SALES.length} sales.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
