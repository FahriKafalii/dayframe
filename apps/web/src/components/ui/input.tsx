"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 rounded-md border px-3 text-sm bg-[color:var(--color-surface)] text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-subtle)] transition-colors outline-none",
        "border-[color:var(--color-border)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/15",
        invalid &&
          "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
