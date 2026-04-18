import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[color:var(--color-border)] mb-6",
        className,
      )}
    >
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[color:var(--color-fg)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[color:var(--color-fg-subtle)] max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
