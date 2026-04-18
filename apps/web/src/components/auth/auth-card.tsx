"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n-context";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="relative min-h-screen flex flex-col bg-[color:var(--color-bg)] overflow-hidden">
      <div className="glow-ambient" aria-hidden="true" />
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />

      <header className="relative z-10 h-16 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-sm font-semibold">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            {t("common.appName")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="bg-[color:var(--color-surface)]/80 backdrop-blur-md border border-[color:var(--color-border)] rounded-xl shadow-[var(--shadow-card)] p-8">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-[color:var(--color-fg-subtle)]">
              {subtitle}
            </p>
            <div className="mt-6">{children}</div>
          </div>
          <div className="mt-4 text-center text-sm text-[color:var(--color-fg-muted)]">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
