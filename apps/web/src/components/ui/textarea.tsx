"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm bg-[color:var(--color-surface)] text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-subtle)] transition-colors outline-none resize-y",
        "border-[color:var(--color-border)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/15",
        invalid &&
          "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
