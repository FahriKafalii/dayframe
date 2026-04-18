"use client";

import { cn } from "@/lib/cn";

const items = [
  { value: 1, label: "Rough", color: "var(--color-mood-1)" },
  { value: 2, label: "Low", color: "var(--color-mood-2)" },
  { value: 3, label: "Ok", color: "var(--color-mood-3)" },
  { value: 4, label: "Good", color: "var(--color-mood-4)" },
  { value: 5, label: "Great", color: "var(--color-mood-5)" },
];

export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(active ? null : it.value)}
            className={cn(
              "group flex flex-col items-center gap-1 py-2 px-3 rounded-lg border transition-all",
              active
                ? "border-[color:var(--color-fg)] bg-[color:var(--color-surface)]"
                : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]",
            )}
            aria-pressed={active}
          >
            <span
              className="h-4 w-4 rounded-full"
              style={{ background: it.color, opacity: active ? 1 : 0.5 }}
            />
            <span
              className={cn(
                "text-[11px]",
                active
                  ? "text-[color:var(--color-fg)] font-medium"
                  : "text-[color:var(--color-fg-subtle)]",
              )}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function moodColor(value: number | null | undefined): string | null {
  if (!value) return null;
  const it = items.find((i) => i.value === value);
  return it?.color ?? null;
}
