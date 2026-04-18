"use client";

import { useEffect, useRef, useState } from "react";
import { useT, type Locale } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";

function FlagTR({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="22" cy="20" r="8" fill="#ffffff" />
      <circle cx="24.5" cy="20" r="6.4" fill="#E30A17" />
      <polygon
        fill="#ffffff"
        points="32,20 28.2,21.24 30.55,18 30.55,22 28.2,18.76"
      />
    </svg>
  );
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <clipPath id="gb-clip">
        <rect width="60" height="40" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" strokeWidth="8" />
        <path
          d="M0,0 L60,40 M60,0 L0,40"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath="url(#gb-clip)"
        />
        <path d="M30,0 V40 M0,20 H60" stroke="#ffffff" strokeWidth="12" />
        <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const options: { value: Locale; label: string; Flag: typeof FlagTR }[] = [
    { value: "en", label: t("lang.en"), Flag: FlagGB },
    { value: "tr", label: t("lang.tr"), Flag: FlagTR },
  ];

  const active = options.find((o) => o.value === locale) ?? options[0];
  const ActiveFlag = active.Flag;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("lang.label")}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md px-2",
          "border border-[var(--color-border)] bg-[var(--color-surface)]",
          "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
          "hover:bg-[var(--color-surface-2)] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/30",
        )}
      >
        <ActiveFlag className="h-4 w-6 rounded-sm ring-1 ring-[var(--color-border)]" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {locale}
        </span>
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
            {t("lang.label")}
          </div>
          {options.map((o) => {
            const isActive = locale === o.value;
            const OFlag = o.Flag;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setLocale(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-left",
                  "hover:bg-[var(--color-surface-2)] transition-colors",
                  isActive
                    ? "text-[var(--color-fg)] font-medium"
                    : "text-[var(--color-fg-muted)]",
                )}
              >
                <OFlag className="h-4 w-6 rounded-sm ring-1 ring-[var(--color-border)]" />
                <span className="flex-1">{o.label}</span>
                {isActive && (
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
