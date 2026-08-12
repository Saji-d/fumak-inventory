"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserCircle,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="FUMAK logo"
        width={36}
        height={36}
        className="rounded-full object-contain shadow-sm ring-1 ring-slate-900/5"
        priority
      />
      <div className="leading-tight">
        <p className="text-base font-bold tracking-tight text-slate-900">FUMAK</p>
        <p className="text-[11px] font-medium text-slate-500">Inventory &amp; Sales</p>
      </div>
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
              active
                ? "bg-slate-900 font-semibold text-white shadow-sm"
                : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon
              size={17}
              strokeWidth={2.25}
              className={active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  return (
    <div className="flex items-center gap-2.5 border-t border-slate-200 px-4 py-3.5">
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 p-1.5 text-slate-500">
        <UserCircle size={22} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-slate-800">Admin</p>
        <p className="truncate text-[11px] text-slate-500">FUMAK Staff</p>
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop / tablet: fixed persistent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Brand />
        </div>
        <NavList pathname={pathname} onNavigate={() => {}} />
        <UserFooter />
      </aside>

      {/* Mobile: drawer (always mounted so the slide/fade can transition both ways) */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-5">
            <Brand />
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="icon-btn"
            >
              <X size={18} />
            </button>
          </div>
          <NavList pathname={pathname} onNavigate={onClose} />
          <UserFooter />
        </aside>
      </div>
    </>
  );
}
