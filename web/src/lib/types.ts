// Small TS union types used to validate the string-typed "enum-like"
// columns at the API boundary (SQLite has no native Prisma enum support).

export const CATEGORIES = ["Clothing", "Shoes", "Bags", "Accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_TYPES = ["CASH", "CARD", "MOBILE_MONEY", "OTHER"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const INVENTORY_TXN_TYPES = ["ADD", "REMOVE", "ADJUST", "SALE"] as const;
export type InventoryTransactionType = (typeof INVENTORY_TXN_TYPES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function isPaymentType(value: unknown): value is PaymentType {
  return typeof value === "string" && (PAYMENT_TYPES as readonly string[]).includes(value);
}

export function isInventoryTxnType(value: unknown): value is InventoryTransactionType {
  return (
    typeof value === "string" &&
    (INVENTORY_TXN_TYPES as readonly string[]).includes(value)
  );
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Other",
};

export const INVENTORY_TXN_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  ADD: "Add",
  REMOVE: "Remove",
  ADJUST: "Adjust",
  SALE: "Sale",
};

export type AnalyticsPeriod =
  | "today"
  | "current_month"
  | "last_3_months"
  | "last_6_months"
  | "current_year"
  | "custom";

// Plain JSON-serializable shapes for data crossing the API boundary
// (Prisma's Date objects become ISO strings once they pass through
// Response.json / fetch).

export interface ProductDTO {
  id: number;
  barcodeValue: string;
  name: string;
  category: Category;
  color: string | null;
  variant: string | null;
  buyingPricePoisha: number;
  sellingPricePoisha: number;
  currentStock: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionDTO {
  id: number;
  productId: number;
  type: InventoryTransactionType;
  quantityDelta: number;
  resultingStock: number;
  reason: string | null;
  saleId: number | null;
  timestamp: string;
  product?: Pick<ProductDTO, "id" | "name" | "barcodeValue" | "category" | "color" | "variant">;
}

export interface SaleItemDTO {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  sellingPriceEachPoisha: number;
  buyingCostEachPoisha: number;
  discountPoisha: number;
  // GET /api/sales (collection) only selects id/name/barcodeValue; POST
  // /api/sales and GET /api/sales/[id] include the full product, so the
  // extra fields are optional here rather than requiring two DTO types.
  product?: Pick<ProductDTO, "id" | "name" | "barcodeValue"> &
    Partial<Pick<ProductDTO, "category" | "color" | "variant">>;
}

export interface SaleDTO {
  id: number;
  timestamp: string;
  paymentType: PaymentType;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  changeAmount: number;
  items: SaleItemDTO[];
}

export interface AppSettingsDTO {
  id: number;
  lowStockThreshold: number;
  currencySymbol: string;
}

export interface DashboardPayload {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  todaySalesCount: number;
  todayRevenuePoisha: number;
  todayGrossProfitPoisha: number;
  totalAmountDuePoisha: number;
  recentSales: SaleDTO[];
  chart: { label: string; revenuePoisha: number }[];
  categoryBreakdown: { category: Category; count: number }[];
  currencySymbol: string;
}

export interface AnalyticsSummary {
  totalRevenuePoisha: number;
  totalItemsSold: number;
  totalBuyingCostPoisha: number;
  grossProfitPoisha: number;
  totalDiscountPoisha: number;
  totalPaidPoisha: number;
  totalDuePoisha: number;
  saleCount: number;
}
