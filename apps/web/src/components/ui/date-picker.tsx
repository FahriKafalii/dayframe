"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS, tr as trLocale } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-context";

const localeMap = { en: enUS, tr: trLocale } as const;

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function fromIsoDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export type DatePickerProps = {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
  allowClear?: boolean;
  align?: "start" | "end";
  leadingIcon?: ReactNode;
  minDate?: string;
  maxDate?: string;
};

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker(
    {
      id,
      value,
      onChange,
      placeholder,
      disabled,
      className,
      invalid,
      allowClear = true,
      align = "start",
      leadingIcon,
      minDate,
      maxDate,
    },
    ref,
  ) {
    const { locale } = useT();
    const loc = localeMap[locale];
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = useMemo(() => fromIsoDate(value), [value]);
    const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date());

    useEffect(() => {
      if (open) setViewMonth(selected ?? new Date());
    }, [open, selected]);

    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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

    const placeholderText = placeholder ?? "gg.aa.yyyy";
    const displayText = selected ? format(selected, "dd MMM yyyy", { locale: loc }) : null;

    const min = fromIsoDate(minDate);
    const max = fromIsoDate(maxDate);

    function isDisabledDate(d: Date): boolean {
      if (min && d < startOfDay(min)) return true;
      if (max && d > endOfDay(max)) return true;
      return false;
    }

    function handleSelect(d: Date) {
      if (isDisabledDate(d)) return;
      onChange(toIsoDate(d));
      setOpen(false);
    }

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation();
      onChange(null);
    }

    const gridDays = useMemo(() => buildGridDays(viewMonth), [viewMonth]);
    const weekdayLabels = useMemo(() => {
      const base = startOfWeek(new Date(), { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) =>
        format(addDays(base, i), "EEEEEE", { locale: loc }),
      );
    }, [loc]);

    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          id={id}
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm",
            "bg-[color:var(--color-surface)]",
            "border-[color:var(--color-border)]",
            "hover:border-[color:var(--color-border-strong)]",
            "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]/30 focus:border-[color:var(--color-ring)]",
            "transition-colors",
            invalid && "border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/30 focus:border-[color:var(--color-danger)]",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <span className="text-[color:var(--color-fg-subtle)] shrink-0">
            {leadingIcon ?? <CalendarIcon size={15} />}
          </span>
          <span
            className={cn(
              "flex-1 text-left truncate",
              displayText
                ? "text-[color:var(--color-fg)]"
                : "text-[color:var(--color-fg-subtle)]",
            )}
          >
            {displayText ?? placeholderText}
          </span>
          {allowClear && displayText && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)]"
              aria-label="Clear"
            >
              <X size={12} />
            </span>
          )}
        </button>

        {open && (
          <div
            role="dialog"
            className={cn(
              "absolute z-50 mt-2 w-[300px] rounded-lg border p-3",
              "bg-[color:var(--color-surface)]",
              "border-[color:var(--color-border)]",
              "shadow-[var(--shadow-pop)] animate-fade-in",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-medium capitalize">
                {format(viewMonth, "LLLL yyyy", { locale: loc })}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {weekdayLabels.map((w) => (
                <div
                  key={w}
                  className="h-8 inline-flex items-center justify-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-fg-subtle)]"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {gridDays.map((d) => {
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const isToday = isSameDay(d, new Date());
                const isSelected = selected ? isSameDay(d, selected) : false;
                const disabled = isDisabledDate(d);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => handleSelect(d)}
                    disabled={disabled}
                    className={cn(
                      "h-9 inline-flex items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                      isSelected
                        ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] font-semibold"
                        : isToday
                          ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] font-medium ring-1 ring-inset ring-[color:var(--color-border-strong)]"
                          : inMonth
                            ? "text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)]"
                            : "text-[color:var(--color-fg-subtle)] hover:bg-[color:var(--color-surface-2)]/60",
                      disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[color:var(--color-border)] pt-2">
              {allowClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] px-2 h-7 rounded-md hover:bg-[color:var(--color-surface-2)] transition-colors"
                >
                  {localeText(locale, "clear")}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] px-2 h-7 rounded-md hover:bg-[color:var(--color-surface-2)] transition-colors"
              >
                {localeText(locale, "today")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function buildGridDays(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function localeText(locale: "en" | "tr", key: "clear" | "today"): string {
  if (locale === "tr") return key === "clear" ? "Temizle" : "Bugün";
  return key === "clear" ? "Clear" : "Today";
}
