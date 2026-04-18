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
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-12 text-sm text-[color:var(--color-fg-subtle)]",
        className,
      )}
    >
      <span className="inline-block h-3 w-3 rounded-full border-2 border-[color:var(--color-border-strong)] border-t-[color:var(--color-accent)] animate-spin mr-2" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
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
          Try again
        </button>
      )}
    </div>
  );
}
