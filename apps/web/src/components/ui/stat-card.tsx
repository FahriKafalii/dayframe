import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wide font-medium text-[color:var(--color-fg-subtle)]">
          {label}
        </p>
        {icon && (
          <div className="h-8 w-8 rounded-md bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg-muted)]">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-[color:var(--color-fg)] leading-none">
        {value}
      </div>
      {hint && (
        <p className="mt-2 text-xs text-[color:var(--color-fg-subtle)]">
          {hint}
        </p>
      )}
    </div>
  );
}
