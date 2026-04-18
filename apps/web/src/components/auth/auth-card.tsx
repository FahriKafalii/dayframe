import Link from "next/link";

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
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--color-bg)]">
      <div className="h-14 flex items-center px-6 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-sm font-semibold">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dayframe
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-[var(--shadow-card)] p-8">
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
