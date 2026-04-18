"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useT, type MessageKey } from "@/lib/i18n-context";

const nav: { href: string; labelKey: MessageKey; icon: typeof LayoutDashboard }[] = [
  { href: "/app", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/app/tasks", labelKey: "nav.tasks", icon: ListChecks },
  { href: "/app/journal", labelKey: "nav.journal", icon: NotebookPen },
  { href: "/app/calendar", labelKey: "nav.calendar", icon: Calendar },
  { href: "/app/settings", labelKey: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="px-5 py-5 border-b border-[color:var(--color-border)]">
        <Link href="/app" className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-sm font-semibold">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            {t("common.appName")}
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors",
                    active
                      ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] font-medium"
                      : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]",
                  )}
                >
                  <Icon size={16} />
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-[color:var(--color-border)]">
        <p className="text-[11px] text-[color:var(--color-fg-subtle)] leading-relaxed">
          {t("nav.tagline")}
        </p>
      </div>
    </aside>
  );
}
