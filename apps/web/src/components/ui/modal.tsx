"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-[color:var(--color-surface)] rounded-xl shadow-[var(--shadow-pop)] border border-[color:var(--color-border)] mt-[6vh]",
          maxWidth,
        )}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            {title && (
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[color:var(--color-fg-subtle)]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[color:var(--color-fg-subtle)] hover:bg-[color:var(--color-surface-2)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[color:var(--color-border)] flex items-center justify-end gap-2 bg-[color:var(--color-surface-2)] rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
