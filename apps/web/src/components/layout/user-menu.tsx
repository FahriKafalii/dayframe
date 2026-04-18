"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const initial = user.username.slice(0, 1).toUpperCase();

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-[color:var(--color-surface-2)]"
      >
        <span className="h-7 w-7 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-xs font-semibold">
          {initial}
        </span>
        <span className="text-sm font-medium">{user.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-lg shadow-[var(--shadow-pop)] py-1 z-40">
          <div className="px-3 py-2 border-b border-[color:var(--color-border)]">
            <p className="text-xs text-[color:var(--color-fg-subtle)]">
              Signed in as
            </p>
            <p className="text-sm font-medium truncate">{user.username}</p>
          </div>
          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 h-9 text-sm text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]"
          >
            <UserIcon size={14} />
            Profile
          </Link>
          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 h-9 text-sm text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]"
          >
            <Settings size={14} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 h-9 text-sm text-[color:var(--color-danger)] hover:bg-red-50"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
