"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n-context";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { FullPageLoader } from "@/components/ui/empty-state";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="lg:hidden text-[15px] font-semibold tracking-tight">
              {t("common.appName")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="mx-1 h-5 w-px bg-[color:var(--color-border)]" />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
