"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  PenLine,
} from "lucide-react";
import type { CalendarDayDto, TaskStatus } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ErrorState, LoadingState } from "@/components/ui/empty-state";
import { moodColor } from "@/components/journal/mood-picker";
import { api, ApiError } from "@/lib/api";
import { useT, type MessageKey } from "@/lib/i18n-context";
import {
  addMonths,
  monthGridDays,
  monthLabel,
  prettyDate,
  todayIso,
  toIso,
} from "@/lib/date";
import { cn } from "@/lib/cn";

const taskStatusKey: Record<TaskStatus, MessageKey> = {
  OPEN: "tasks.statusOpen",
  DONE: "tasks.statusDone",
  CANCELED: "tasks.statusCanceled",
};

const dayKeys: MessageKey[] = [
  "calendar.mondayShort",
  "calendar.tuesdayShort",
  "calendar.wednesdayShort",
  "calendar.thursdayShort",
  "calendar.fridayShort",
  "calendar.saturdayShort",
  "calendar.sundayShort",
];

export default function CalendarPage() {
  const { t, locale } = useT();
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [days, setDays] = useState<CalendarDayDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(todayIso());
  const [pickerOpen, setPickerOpen] = useState(false);

  const goToToday = () => {
    const now = new Date();
    setAnchor(now);
    setSelected(todayIso());
  };

  const jumpToMonth = (year: number, monthIdx: number) => {
    setAnchor(new Date(year, monthIdx, 1));
    setPickerOpen(false);
  };

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
        err instanceof ApiError ? err.message : t("calendar.loadFailed"),
      );
    }
  }, [from, to, t]);

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
        title={t("calendar.title")}
        description={t("calendar.description")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goToToday}>
              {t("common.today")}
            </Button>
            <div className="flex items-center gap-1 border border-[color:var(--color-border)] rounded-md p-0.5 bg-[color:var(--color-surface)]">
              <button
                onClick={() => setAnchor((d) => addMonths(d, -1))}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="text-sm font-medium px-3 min-w-36 text-center rounded-md hover:bg-[color:var(--color-surface-2)] transition-colors h-8"
                aria-label={t("calendar.pickMonthTitle")}
              >
                {monthLabel(anchor, locale)}
              </button>
              <button
                onClick={() => setAnchor((d) => addMonths(d, 1))}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
          retryLabel={t("common.tryAgain")}
        />
      ) : !days ? (
        <LoadingState />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <Card>
            <div className="grid grid-cols-7 text-[11px] uppercase tracking-wide font-medium text-[color:var(--color-fg-subtle)] border-b border-[color:var(--color-border)]">
              {dayKeys.map((k) => (
                <div key={k} className="py-2 px-2">
                  {t(k)}
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
                            {day.tasks.openCount} {t("calendar.statOpen").toLowerCase()}
                          </span>
                        )}
                        {day.tasks.doneCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--color-success-soft)] border border-[color:var(--color-success)]/30 text-[color:var(--color-success)]">
                            {day.tasks.doneCount} {t("calendar.statDone").toLowerCase()}
                          </span>
                        )}
                        {day.journal.exists && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--color-info-soft)] border border-[color:var(--color-info)]/30 text-[color:var(--color-info)]">
                            <PenLine size={10} /> {t("calendar.journalLabel").toLowerCase()}
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
                  <CardTitle>{prettyDate(selected, locale)}</CardTitle>
                  <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                    {t("calendar.dayDetail")}
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {!selectedDay ? (
                  <p className="text-sm text-[color:var(--color-fg-subtle)]">
                    {t("calendar.noData")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)] mb-1.5">
                        {t("calendar.journalLabel")}
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
                          <span className="text-sm">
                            {t("calendar.entryExists")}
                          </span>
                          <Link
                            href={`/app/journal?date=${selected}`}
                            className="ml-auto text-xs underline text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                          >
                            {t("common.open")}
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/app/journal?date=${selected}`}
                          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-fg)] underline underline-offset-4"
                        >
                          <NotebookPen size={14} />
                          {t("calendar.writeEntry")}
                        </Link>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)] mb-1.5">
                        {t("calendar.tasksDue")}
                      </p>
                      {selectedDay.tasks.due.length === 0 ? (
                        <p className="text-sm text-[color:var(--color-fg-subtle)]">
                          {t("calendar.nothingDue")}
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {selectedDay.tasks.due.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Badge
                                tone={
                                  task.status === "DONE"
                                    ? "success"
                                    : task.status === "CANCELED"
                                      ? "neutral"
                                      : "info"
                                }
                              >
                                {t(taskStatusKey[task.status])}
                              </Badge>
                              <span className="truncate">{task.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[color:var(--color-border)]">
                      <Stat
                        label={t("calendar.statOpen")}
                        value={selectedDay.tasks.openCount}
                      />
                      <Stat
                        label={t("calendar.statDone")}
                        value={selectedDay.tasks.doneCount}
                      />
                      <Stat
                        label={t("calendar.statCanceled")}
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

      <MonthPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchor={anchor}
        onPick={jumpToMonth}
        locale={locale}
        title={t("calendar.pickMonthTitle")}
        description={t("calendar.pickMonthDesc")}
        todayLabel={t("common.today")}
      />
    </div>
  );
}

function MonthPickerModal({
  open,
  onClose,
  anchor,
  onPick,
  locale,
  title,
  description,
  todayLabel,
}: {
  open: boolean;
  onClose: () => void;
  anchor: Date;
  onPick: (year: number, monthIdx: number) => void;
  locale: "en" | "tr";
  title: string;
  description: string;
  todayLabel: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(anchor.getFullYear());

  useEffect(() => {
    if (open) setYear(anchor.getFullYear());
  }, [open, anchor]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleString(
          locale === "tr" ? "tr-TR" : "en-US",
          { month: "short" },
        ),
      ),
    [locale],
  );

  const currentY = today.getFullYear();
  const currentM = today.getMonth();
  const anchorY = anchor.getFullYear();
  const anchorM = anchor.getMonth();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="max-w-md"
      footer={
        <button
          type="button"
          onClick={() => onPick(currentY, currentM)}
          className="text-sm px-3 h-8 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] transition-colors"
        >
          {todayLabel}
        </button>
      }
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-base font-semibold tabular-nums">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]"
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, idx) => {
          const isSelected = year === anchorY && idx === anchorM;
          const isCurrent = year === currentY && idx === currentM;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onPick(year, idx)}
              className={cn(
                "h-11 rounded-md border text-sm font-medium capitalize transition-colors",
                isSelected
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] border-[color:var(--color-accent)]"
                  : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]",
                !isSelected &&
                  isCurrent &&
                  "ring-1 ring-[color:var(--color-ring)]/40",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </Modal>
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
