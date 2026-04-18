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
import type {
  StatsActivityDayDto,
  StatsSummaryDto,
  TaskDto,
} from "@dayframe/types";
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
import { useT } from "@/lib/i18n-context";
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
  const { t, locale } = useT();
  const [stats, setStats] = useState<StatsSummaryDto | null>(null);
  const [openTasks, setOpenTasks] = useState<TaskDto[] | null>(null);
  const [activity, setActivity] = useState<StatsActivityDayDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const today = todayIso();
  const from = toIso(subDays(new Date(), 6));
  const to = toIso(addDays(new Date(), 0));

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, tasks, act] = await Promise.all([
        api.stats.summary(),
        api.tasks.list({ status: "OPEN" }),
        api.stats.activity(from, to),
      ]);
      setStats(s);
      setOpenTasks(tasks);
      setActivity(act);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("dashboard.dashboardLoadFail");
      setError(message);
    }
  }, [from, to, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleDone(task: TaskDto) {
    try {
      await api.tasks.update(task.id, {
        status: task.status === "DONE" ? "OPEN" : "DONE",
      });
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.updateFailed"),
      );
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
      toast.success(t("dashboard.taskCreated"));
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.createFailed"),
      );
    } finally {
      setCreating(false);
    }
  }

  const weekBars = useMemo(() => {
    if (!activity) return [];
    return activity.map((d) => ({
      day: shortDate(d.date, locale),
      created: d.created,
      done: d.done,
    }));
  }, [activity, locale]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return t("dashboard.greetingLate");
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 18) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  }, [t]);

  const topThree = openTasks?.slice(0, 5) ?? [];

  return (
    <div>
      <PageHeader
        title={`${greeting}${user ? `, ${user.username}` : ""}`}
        description={prettyDate(today, locale)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              {t("common.newTask")}
            </Button>
            <Link href={`/app/journal?date=${today}`}>
              <Button>
                <NotebookPen size={16} />
                {t("dashboard.todayJournal")}
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
          label={t("dashboard.openTasks")}
          value={stats ? stats.openTasks : "—"}
          hint={t("dashboard.openTasksHint")}
          icon={<ListChecks size={16} />}
        />
        <StatCard
          label={t("dashboard.done7")}
          value={stats ? stats.doneTasksLast7Days : "—"}
          hint={t("dashboard.done7Hint")}
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          label={t("dashboard.streak")}
          value={stats ? `${stats.journalStreakEndingToday}d` : "—"}
          hint={
            stats?.lastJournalDate
              ? t("dashboard.streakHintLast", {
                  date: shortDate(stats.lastJournalDate, locale),
                })
              : t("dashboard.streakHintNone")
          }
          icon={<Flame size={16} />}
        />
        <StatCard
          label={t("dashboard.lastJournal")}
          value={
            stats?.lastJournalDate
              ? shortDate(stats.lastJournalDate, locale)
              : "—"
          }
          hint={t("dashboard.lastJournalHint")}
          icon={<CalendarRange size={16} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("dashboard.focusTitle")}</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                {t("dashboard.focusSubtitle")}
              </p>
            </div>
            <Link
              href="/app/tasks"
              className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1"
            >
              {t("common.viewAll")} <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {!openTasks ? (
              <LoadingState />
            ) : topThree.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={<ListChecks size={18} />}
                  title={t("dashboard.emptyTitle")}
                  description={t("dashboard.emptyBody")}
                  action={
                    <Button onClick={() => setShowCreate(true)}>
                      <Plus size={16} />
                      {t("common.newTask")}
                    </Button>
                  }
                />
              </div>
            ) : (
              <div>
                {topThree.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
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
              <CardTitle>{t("dashboard.last7")}</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                {t("dashboard.last7Sub")}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {!activity ? (
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
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--color-fg)",
                      }}
                    />
                    <Bar
                      dataKey="created"
                      name={t("dashboard.last7Created")}
                      fill="var(--color-border-strong)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="done"
                      name={t("dashboard.last7Done")}
                      fill="var(--color-accent)"
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
          label={t("dashboard.quickPlanLabel")}
          body={t("dashboard.quickPlanBody")}
          icon={<ListChecks size={18} />}
        />
        <QuickAction
          href={`/app/journal?date=${today}`}
          label={t("dashboard.quickWriteLabel")}
          body={t("dashboard.quickWriteBody")}
          icon={<NotebookPen size={18} />}
        />
        <QuickAction
          href="/app/calendar"
          label={t("dashboard.quickMonthLabel")}
          body={t("dashboard.quickMonthBody")}
          icon={<CalendarRange size={18} />}
        />
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t("tasks.newTaskTitle")}
        description={t("tasks.newTaskSubtitle")}
      >
        <TaskForm
          submitLabel={t("tasks.createBtn")}
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
      className="group bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl p-5 shadow-[var(--shadow-card)] hover:border-[color:var(--color-border-strong)] hover:shadow-[var(--shadow-pop)] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-lg bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg)] group-hover:bg-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-fg)] transition-colors">
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
