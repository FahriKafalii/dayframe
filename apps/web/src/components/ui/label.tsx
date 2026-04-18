import { cn } from "@/lib/cn";

export function Label({
  className,
  children,
  htmlFor,
  required,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wide",
        className,
      )}
    >
      {children}
      {required && <span className="text-[color:var(--color-danger)] ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-xs text-[color:var(--color-danger)]">{children}</p>
  );
}
