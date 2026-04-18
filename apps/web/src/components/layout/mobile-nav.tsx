"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  ListChecks,
  Menu,
  NotebookPen,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/tasks", label: "Tasks", icon: ListChecks },
  { href: "/app/journal", label: "Journal", icon: NotebookPen },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <>
      <button
        className="lg:hidden h-9 w-9 rounded-md inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[color:var(--color-surface)] border-r border-[color:var(--color-border)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[color:var(--color-border)]">
              <span className="font-semibold tracking-tight">Dayframe</span>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-md hover:bg-[color:var(--color-surface-2)] inline-flex items-center justify-center"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="p-3 flex-1">
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors",
                          active
                            ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] font-medium"
                            : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]",
                        )}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
