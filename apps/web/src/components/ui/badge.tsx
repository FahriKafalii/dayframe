import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full text-[11px] font-medium px-2 py-0.5 border",
  {
    variants: {
      tone: {
        neutral:
          "bg-[color:var(--color-surface-2)] border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]",
        success:
          "bg-emerald-50 border-emerald-200 text-emerald-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        danger: "bg-red-50 border-red-200 text-red-800",
        info: "bg-sky-50 border-sky-200 text-sky-800",
        accent:
          "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] border-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
