import { cn } from "@/lib/cn";

export function Logo({
  size = 28,
  className,
  variant = "mark",
}: {
  size?: number;
  className?: string;
  variant?: "mark" | "filled";
}) {
  if (variant === "filled") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <LogoMark size={Math.round(size * 0.7)} />
      </span>
    );
  }

  return <LogoMark size={size} className={className} />;
}

function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Stroke weight scales slightly at small sizes for legibility
  const stroke = size <= 18 ? 3 : 2.25;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="13" strokeWidth={stroke} />
      <line x1="2.5" y1="13.5" x2="29.5" y2="13.5" strokeWidth={stroke} />
    </svg>
  );
}

export function LogoLockup({
  size = 28,
  className,
  textClassName,
}: {
  size?: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo size={size} variant="filled" />
      <span
        className={cn(
          "text-[15px] font-semibold tracking-tight",
          textClassName,
        )}
      >
        Dayframe
      </span>
    </span>
  );
}
