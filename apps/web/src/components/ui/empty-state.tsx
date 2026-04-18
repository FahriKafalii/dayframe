import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-[color:var(--color-border)] rounded-xl bg-[color:var(--color-surface)]",
        className,
      )}
    >
      {icon && (
        <div className="h-10 w-10 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg-subtle)] mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-[color:var(--color-fg)]">
        {title}
      </h4>
      {description && (
        <p className="mt-1 text-sm text-[color:var(--color-fg-subtle)] max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-12",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="inline-block h-5 w-5 rounded-full border-2 border-[color:var(--color-border-strong)] border-t-[color:var(--color-accent)] animate-spin" />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[color:var(--color-bg)]"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="inline-block h-10 w-10 rounded-full border-[3px] border-[color:var(--color-border-strong)] border-t-[color:var(--color-accent)] animate-spin" />
        <span className="h-1 w-24 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
          <span className="block h-full w-1/3 bg-[color:var(--color-accent)]/60 animate-[loading-slide_1.4s_ease-in-out_infinite]" />
        </span>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-[color:var(--color-danger)] font-medium">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm underline text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
