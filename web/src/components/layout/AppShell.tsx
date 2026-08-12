"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastProvider } from "@/components/ui/Toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-100/70 via-slate-50 to-slate-50">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="md:pl-64">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
          <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
