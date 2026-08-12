import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  showLogo = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  /** Tasteful branded moment for genuinely-empty top-level lists — use sparingly. */
  showLogo?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      {showLogo ? (
        <Image
          src="/logo.jpeg"
          alt="FUMAK"
          width={72}
          height={72}
          className="mb-4 rounded-full object-contain shadow-sm"
        />
      ) : Icon ? (
        <span className="mb-3 inline-flex items-center justify-center rounded-full bg-slate-100 p-3 text-slate-400">
          <Icon size={22} strokeWidth={1.75} />
        </span>
      ) : null}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
