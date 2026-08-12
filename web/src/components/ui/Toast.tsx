"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  leaving: boolean;
}

interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconClass: string; barClass: string }
> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-600", barClass: "bg-emerald-500" },
  error: { icon: XCircle, iconClass: "text-red-600", barClass: "bg-red-500" },
  info: { icon: Info, iconClass: "text-blue-600", barClass: "bg-blue-500" },
};

const AUTO_DISMISS_MS = 4500;
const EXIT_ANIMATION_MS = 200;

/**
 * Hand-rolled toast system: a React context + provider + a fixed-position
 * stack of dismissing toast cards. Mounted once in AppShell so it's
 * available on every page via useToast().
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ variant = "info", title, description }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant, title, description, leaving: false }]);
      const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-stretch gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pr-2 shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out sm:w-96 ${
                t.leaving ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100"
              }`}
            >
              <span className={`mt-0.5 shrink-0 ${style.iconClass}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="icon-btn mt-0.5 shrink-0"
              >
                <X size={14} />
              </button>
              <span className={`absolute inset-x-0 bottom-0 h-0.5 ${style.barClass}`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
