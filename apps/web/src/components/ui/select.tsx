"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full h-10 rounded-md border pl-3 pr-9 text-sm appearance-none bg-[color:var(--color-surface)] text-[color:var(--color-fg)] transition-colors outline-none",
          "border-[color:var(--color-border)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/15",
          invalid &&
            "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)] pointer-events-none"
      />
    </div>
  ),
);
Select.displayName = "Select";
