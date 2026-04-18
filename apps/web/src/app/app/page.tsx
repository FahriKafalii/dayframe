"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Flame,
  ListChecks,
  NotebookPen,
  Plus,
} from "lucide-react";
import type { CalendarDayDto, StatsSummaryDto, TaskDto } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { TaskRow } from "@/components/tasks/task-row";
import { Modal } from "@/components/ui/modal";
import { TaskForm } from "@/components/tasks/task-form";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { addDays, prettyDate, shortDate, subDays, todayIso, toIso } from "@/lib/date";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsSummaryDto | null>(null);
  const [openTasks, setOpenTasks] = useState<TaskDto[] | null>(null);
  const [week, setWeek] = useState<CalendarDayDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const today = todayIso();
  const from = toIso(subDays(new Date(), 6));
  const to = toIso(addDays(new Date(), 0));

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, tasks, cal] = await Promise.all([
        api.stats.summary(),
        api.tasks.list({ status: "OPEN" }),
        api.calendar.range(from, to),
      ]);
      setStats(s);
      setOpenTasks(tasks);
      setWeek(cal);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load dashboard";
      setError(message);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleDone(t: TaskDto) {
    try {
      await api.tasks.update(t.id, {
        status: t.status === "DONE" ? "OPEN" : "DONE",
      });
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function handleCreate(values: {
    title: string;
    notes: string | null;
    priority: "LOW" | "MED" | "HIGH";
    due_date: string | null;
  }) {
    setCreating(true);
    try {
      await api.tasks.create(values);
      setShowCreate(false);
      toast.success("Task created");
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  const weekBars = useMemo(() => {
    if (!week) return [];
    return week.map((d) => ({
      day: shortDate(d.date),
      done: d.tasks.doneCount,
      open: d.tasks.openCount,
      mood: d.journal.mood ?? 0,
    }));
  }, [week]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Still up";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const topThree = openTasks?.slice(0, 5) ?? [];

  return (
    <div>
      <PageHeader
        title={`${greeting}${user ? `, ${user.username}` : ""}`}
        description={prettyDate(today)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              New task
            </Button>
            <Link href={`/app/journal?date=${today}`}>
              <Button>
                <NotebookPen size={16} />
                Today’s journal
              </Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open tasks"
          value={stats ? stats.openTasks : "—"}
          hint="Currently pending"
          icon={<ListChecks size={16} />}
        />
        <StatCard
          label="Done · 7 days"
          value={stats ? stats.doneTasksLast7Days : "—"}
          hint="Completed recently"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          label="Journal streak"
          value={stats ? `${stats.journalStreakEndingToday}d` : "—"}
          hint={
            stats?.lastJournalDate
              ? `Last entry ${shortDate(stats.lastJournalDate)}`
              : "No entries yet"
          }
          icon={<Flame size={16} />}
        />
        <StatCard
          label="Last journal"
          value={
            stats?.lastJournalDate ? shortDate(stats.lastJournalDate) : "—"
          }
          hint="Most recent reflection"
          icon={<CalendarRange size={16} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Today’s focus</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                Your open tasks, ordered as they come.
              </p>
            </div>
            <Link
              href="/app/tasks"
              className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {!openTasks ? (
              <LoadingState />
            ) : topThree.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={<ListChecks size={18} />}
                  title="Nothing open"
                  description="You're clear. Capture the next thing you'll tackle."
                  action={
                    <Button onClick={() => setShowCreate(true)}>
                      <Plus size={16} />
                      New task
                    </Button>
                  }
                />
              </div>
            ) : (
              <div>
                {topThree.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggleDone={handleToggleDone}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Last 7 days</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                Completions & pending.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {!week ? (
              <LoadingState />
            ) : (
              <div className="h-44 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekBars}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "var(--color-fg-subtle)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-fg-subtle)" }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-surface-2)" }}
                      contentStyle={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="done"
                      name="Done"
                      fill="var(--color-accent)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="open"
                      name="Open"
                      fill="var(--color-border-strong)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <QuickAction
          href="/app/tasks"
          label="Plan tasks"
          body="Capture what matters next."
          icon={<ListChecks size={18} />}
        />
        <QuickAction
          href={`/app/journal?date=${today}`}
          label="Write today"
          body="Log mood, wins, blockers."
          icon={<NotebookPen size={18} />}
        />
        <QuickAction
          href="/app/calendar"
          label="See the month"
          body="Visualize your rhythm."
          icon={<CalendarRange size={18} />}
        />
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New task"
        description="Capture it now, decide priority later."
      >
        <TaskForm
          submitLabel="Create task"
          submitting={creating}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

function QuickAction({
  href,
  label,
  body,
  icon,
}: {
  href: string;
  label: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl p-5 shadow-[var(--shadow-card)] hover:border-[color:var(--color-border-strong)] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-lg bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg)]">
          {icon}
        </div>
        <ArrowRight
          size={14}
          className="text-[color:var(--color-fg-subtle)] group-hover:translate-x-0.5 transition-transform"
        />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{label}</h3>
      <p className="mt-1 text-sm text-[color:var(--color-fg-subtle)]">{body}</p>
    </Link>
  );
}
