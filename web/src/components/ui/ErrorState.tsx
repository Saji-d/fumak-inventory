import { AlertTriangle, RotateCcw } from "lucide-react";

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-6 py-14 text-center">
      <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-3 text-red-600">
        <AlertTriangle size={20} strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary">
          <RotateCcw size={14} />
          Try again
        </button>
      ) : null}
    </div>
  );
}
