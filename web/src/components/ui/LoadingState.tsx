export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-14 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      {label}
    </div>
  );
}

/** Shimmering placeholder rows for table-shaped content while it loads. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <span
              key={c}
              className="h-3.5 flex-1 animate-pulse rounded bg-slate-100"
              style={{ animationDelay: `${(r * cols + c) * 40}ms`, maxWidth: c === 0 ? "40%" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Shimmering placeholder grid for a row of StatCards while it loads. */
export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-[92px] animate-pulse p-4">
          <div className="h-2.5 w-16 rounded bg-slate-100" />
          <div className="mt-3 h-6 w-20 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
