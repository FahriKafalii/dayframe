"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  PenLine,
} from "lucide-react";
import type { CalendarDayDto } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/empty-state";
import { moodColor } from "@/components/journal/mood-picker";
import { api, ApiError } from "@/lib/api";
import {
  addMonths,
  monthGridDays,
  monthLabel,
  prettyDate,
  todayIso,
  toIso,
} from "@/lib/date";
import { cn } from "@/lib/cn";

export default function CalendarPage() {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [days, setDays] = useState<CalendarDayDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(todayIso());

  const grid = useMemo(() => monthGridDays(anchor), [anchor]);
  const from = useMemo(() => toIso(grid[0]), [grid]);
  const to = useMemo(() => toIso(grid[grid.length - 1]), [grid]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.calendar.range(from, to);
      setDays(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load calendar",
      );
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDayDto>();
    (days ?? []).forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

  const selectedDay = byDate.get(selected) ?? null;

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="A month view that stitches tasks and journaling together."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setAnchor(new Date())}
            >
              Today
            </Button>
            <div className="flex items-center gap-1 border border-[color:var(--color-border)] rounded-md p-0.5 bg-[color:var(--color-surface)]">
              <button
                onClick={() => setAnchor((d) => addMonths(d, -1))}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium px-3 min-w-36 text-center">
                {monthLabel(anchor)}
              </span>
              <button
                onClick={() => setAnchor((d) => addMonths(d, 1))}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !days ? (
        <LoadingState />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <Card>
            <div className="grid grid-cols-7 text-[11px] uppercase tracking-wide font-medium text-[color:var(--color-fg-subtle)] border-b border-[color:var(--color-border)]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2 px-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((d, i) => {
                const iso = toIso(d);
                const inMonth = d.getMonth() === anchor.getMonth();
                const day = byDate.get(iso);
                const isToday = iso === todayIso();
                const isSelected = iso === selected;
                const mood = day?.journal.mood ?? null;
                const mc = moodColor(mood);
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={cn(
                      "relative text-left h-24 sm:h-28 border-r border-b border-[color:var(--color-border)] p-2 transition-colors",
                      (i + 1) % 7 === 0 && "border-r-0",
                      !inMonth && "bg-[color:var(--color-surface-2)]/40",
                      isSelected &&
                        "ring-2 ring-inset ring-[color:var(--color-ring)]/30",
                      "hover:bg-[color:var(--color-surface-2)]",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          !inMonth && "text-[color:var(--color-fg-subtle)]",
                          isToday &&
                            "inline-flex items-center justify-center h-5 w-5 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]",
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {mc && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: mc }}
                          aria-label={`Mood ${mood}`}
                        />
                      )}
                    </div>
                    {day && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {day.tasks.openCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]">
                            {day.tasks.openCount} open
                          </span>
                        )}
                        {day.tasks.doneCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                            {day.tasks.doneCount} done
                          </span>
                        )}
                        {day.journal.exists && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800">
                            <PenLine size={10} /> journal
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{prettyDate(selected)}</CardTitle>
                  <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                    Day detail
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {!selectedDay ? (
                  <p className="text-sm text-[color:var(--color-fg-subtle)]">
                    No data for this day.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)] mb-1.5">
                        Journal
                      </p>
                      {selectedDay.journal.exists ? (
                        <div className="flex items-center gap-2">
                          {selectedDay.journal.mood && (
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                background:
                                  moodColor(selectedDay.journal.mood) ??
                                  "var(--color-border-strong)",
                              }}
                            />
                          )}
                          <span className="text-sm">Entry exists</span>
                          <Link
                            href={`/app/journal?date=${selected}`}
                            className="ml-auto text-xs underline text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                          >
                            Open
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/app/journal?date=${selected}`}
                          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-fg)] underline underline-offset-4"
                        >
                          <NotebookPen size={14} />
                          Write an entry
                        </Link>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)] mb-1.5">
                        Tasks due
                      </p>
                      {selectedDay.tasks.due.length === 0 ? (
                        <p className="text-sm text-[color:var(--color-fg-subtle)]">
                          Nothing due.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {selectedDay.tasks.due.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Badge
                                tone={
                                  t.status === "DONE"
                                    ? "success"
                                    : t.status === "CANCELED"
                                      ? "neutral"
                                      : "info"
                                }
                              >
                                {t.status}
                              </Badge>
                              <span className="truncate">{t.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[color:var(--color-border)]">
                      <Stat label="Open" value={selectedDay.tasks.openCount} />
                      <Stat label="Done" value={selectedDay.tasks.doneCount} />
                      <Stat
                        label="Canceled"
                        value={selectedDay.tasks.canceledCount}
                      />
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
