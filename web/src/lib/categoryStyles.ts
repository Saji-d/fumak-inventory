import { Gem, Shirt, ShoppingBag, Footprints, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/types";

// Single source of truth for category -> color/icon mapping. Import this
// wherever a category shows up (Products table badges, category filter
// pills, dashboard category chart legend/segments) instead of hardcoding
// per-usage classes.
//
// Hues chosen to be harmonious but distinct from the KPI semantic colors
// used on StatCard (blue/indigo = Products/Stock, amber = Low Stock,
// emerald = Sales/Profit, violet = Revenue, red = Amount Due).

export interface CategoryStyle {
  icon: LucideIcon;
  /** Text color for badges/pills on a tinted background. */
  text: string;
  /** Tinted background for badges/pills. */
  bg: string;
  /** Border color to pair with the tinted background. */
  border: string;
  /** Solid background, e.g. active pill state. */
  solid: string;
  /** Hex color for chart segments/legends (Recharts needs raw color values). */
  chartColor: string;
  /** Icon chip background used in richer contexts (e.g. table row icon). */
  chip: string;
}

export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  Clothing: {
    icon: Shirt,
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    solid: "bg-indigo-600",
    chartColor: "#4f46e5",
    chip: "bg-indigo-100 text-indigo-600",
  },
  Shoes: {
    icon: Footprints,
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    solid: "bg-amber-600",
    chartColor: "#d97706",
    chip: "bg-amber-100 text-amber-600",
  },
  Bags: {
    icon: ShoppingBag,
    text: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    solid: "bg-teal-600",
    chartColor: "#0d9488",
    chip: "bg-teal-100 text-teal-600",
  },
  Accessories: {
    icon: Gem,
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    solid: "bg-rose-600",
    chartColor: "#e11d48",
    chip: "bg-rose-100 text-rose-600",
  },
};
