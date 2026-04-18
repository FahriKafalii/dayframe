"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  ListChecks,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n-context";

export default function LandingPage() {
  const { t } = useT();

  return (
    <div className="relative min-h-screen bg-[color:var(--color-bg)] overflow-hidden">
      <div className="glow-ambient" aria-hidden="true" />
      <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />

      <header className="relative z-10 h-16 flex items-center justify-between max-w-6xl mx-auto px-6">
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
          <span className="mx-1 h-5 w-px bg-[color:var(--color-border)]" />
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] h-9 px-3 items-center"
          >
            {t("common.signIn")}
          </Link>
          <Link href="/register">
            <Button size="sm">{t("common.getStarted")}</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl animate-fade-up">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)]/70 backdrop-blur-sm border border-[color:var(--color-border)] rounded-full px-3 py-1">
            <Sparkles size={12} />
            {t("landing.eyebrow")}
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[color:var(--color-fg)] leading-[1.05]">
            {t("landing.headline1")}
            <br />
            {t("landing.headline2")}
            <br />
            <span className="text-[color:var(--color-fg-subtle)]">
              {t("landing.headline3")}
            </span>
          </h1>
          <p className="mt-6 text-lg text-[color:var(--color-fg-muted)] max-w-2xl leading-relaxed">
            {t("landing.lede")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button size="lg">
                {t("common.startFree")}
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                {t("common.haveAccount")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={<ListChecks size={18} />}
            title={t("landing.feat1Title")}
            body={t("landing.feat1Body")}
          />
          <Feature
            icon={<NotebookPen size={18} />}
            title={t("landing.feat2Title")}
            body={t("landing.feat2Body")}
          />
          <Feature
            icon={<CalendarRange size={18} />}
            title={t("landing.feat3Title")}
            body={t("landing.feat3Body")}
          />
        </div>
      </section>

      <section className="relative z-10 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-3 text-[color:var(--color-fg-muted)] max-w-xl mx-auto">
            {t("landing.ctaBody")}
          </p>
          <div className="mt-6">
            <Link href="/register">
              <Button size="lg">
                {t("common.createAccount")}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-8 text-center text-xs text-[color:var(--color-fg-subtle)]">
        © {new Date().getFullYear()} {t("common.appName")}. {t("landing.footer")}
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative bg-[color:var(--color-surface)]/80 backdrop-blur-sm border border-[color:var(--color-border)] rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="h-9 w-9 rounded-lg bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg)] group-hover:bg-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-fg)] transition-colors">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-[color:var(--color-fg-muted)] leading-relaxed">
        {body}
      </p>
    </div>
  );
}
