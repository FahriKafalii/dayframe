"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = mounted ? (theme ?? "system") : "system";
  const effective = mounted ? (resolvedTheme ?? "light") : "light";

  const Icon = !mounted
    ? Sun
    : current === "system"
      ? Monitor
      : effective === "dark"
        ? Moon
        : Sun;

  const options: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("theme.light"), icon: Sun },
    { value: "dark", label: t("theme.dark"), icon: Moon },
    { value: "system", label: t("theme.system"), icon: Monitor },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("theme.label")}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md",
          "border border-[var(--color-border)] bg-[var(--color-surface)]",
          "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
          "hover:bg-[var(--color-surface-2)] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/30",
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-40 overflow-hidden rounded-lg",
            "border border-[var(--color-border)] bg-[var(--color-surface)]",
            "shadow-[var(--shadow-pop)] z-50 animate-fade-in",
          )}
        >
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
            {t("theme.label")}
          </div>
          {options.map((o) => {
            const active = current === o.value;
            const OIcon = o.icon;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-2 text-sm text-left",
                  "hover:bg-[var(--color-surface-2)] transition-colors",
                  active
                    ? "text-[var(--color-fg)] font-medium"
                    : "text-[var(--color-fg-muted)]",
                )}
              >
                <OIcon className="h-4 w-4" />
                <span className="flex-1">{o.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
