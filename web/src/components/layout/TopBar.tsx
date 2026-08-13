"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Today's snapshot of your shop" },
  "/products": { title: "Products", subtitle: "Manage your product catalog" },
  "/inventory": { title: "Inventory", subtitle: "Track stock levels and movements" },
  "/sales": { title: "Sales", subtitle: "Scan items, build a cart, and check out" },
  "/analytics": { title: "Analytics", subtitle: "Revenue, profit, and sales performance" },
  "/settings": { title: "Settings", subtitle: "Shop-wide preferences" },
};

function pageMeta(pathname: string): { title: string; subtitle?: string } {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/sales/")) {
    return { title: "Sale Receipt", subtitle: "Invoice for a completed sale" };
  }
  const segment = "/" + pathname.split("/")[1];
  if (segment === "/products" && PAGE_META[segment]) {
    if (pathname.includes("/new")) {
      return { title: `${PAGE_META[segment].title} · New`, subtitle: "Add a new product to the catalog" };
    }
    return { title: PAGE_META[segment].title, subtitle: "Edit product details and stock" };
  }
  return { title: "FUMAK" };
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const meta = pageMeta(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm md:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="icon-btn md:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-slate-900">{meta.title}</h1>
        {meta.subtitle ? (
          <p className="truncate text-xs text-slate-500">{meta.subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
