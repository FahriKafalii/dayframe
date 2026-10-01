"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  List,
  ListChecks,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { TaskDto, TaskGroupDto, TaskStatus } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/empty-state";
import { TaskRow } from "@/components/tasks/task-row";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { GroupSidebar } from "@/components/tasks/group-sidebar";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { errorMessage } from "@/lib/error-message";
import { sectionizeByDate } from "@/lib/task-sections";
import { buildSmartFilter, type SmartView } from "@/lib/task-views";
import { todayIso } from "@/lib/date";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

type Filter = "ALL" | TaskStatus;
type View = "active" | "trash";
/** Group filter: "all" (no filter), "none" (ungrouped), or a group id. */
type GroupFilter = "all" | "none" | string;

export default function TasksPage() {
  const { t } = useT();
  const [tasks, setTasks] = useState<TaskDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("active");
  const [status, setStatus] = useState<Filter>("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskDto | null>(null);
  const [groups, setGroups] = useState<TaskGroupDto[]>([]);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [smartView, setSmartView] = useState<SmartView>("all");
  const [search, setSearch] = useState("");
  const [viewCounts, setViewCounts] = useState<Partial<Record<SmartView, number>>>({});
  const [groupBy, setGroupBy] = useState<"none" | "date">("none");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasDateFilter = from !== "" || to !== "";
  const hasActiveFilters = status !== "ALL" || hasDateFilter;

  const isTrash = view === "trash";
  // Reordering persists absolute positions, so it must run against the full
  // unfiltered list or positions would be computed from a partial view.
  const canReorder =
    !isTrash &&
    groupBy === "none" &&
    status === "ALL" &&
    from === "" &&
    to === "" &&
    groupFilter === "all";

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await api.taskGroups.list());
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadViewCounts = useCallback(async () => {
    try {
      const all = await api.tasks.list();
      const today = todayIso();
      setViewCounts({
        all: all.length,
        myday: all.filter((x) => x.due_date === today).length,
        important: all.filter((x) => x.is_important).length,
        planned: all.filter((x) => x.due_date).length,
      });
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const load = useCallback(async () => {
    setError(null);
    setTasks(null);
    try {
      if (view === "trash") {
        setTasks(await api.tasks.list({ deleted: true }));
        return;
      }
      const filters: Parameters<typeof api.tasks.list>[0] = {
        ...buildSmartFilter(smartView, todayIso()),
      };
      if (status !== "ALL") filters.status = status;
      if (from) filters.from = from;
      if (to) filters.to = to;
      if (groupFilter !== "all") filters.group_id = groupFilter;
      if (search.trim()) filters.search = search.trim();
      setTasks(await api.tasks.list(filters));
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }, [view, status, from, to, groupFilter, smartView, search, t]);

  const refresh = useCallback(() => {
    load();
    loadViewCounts();
  }, [load, loadViewCounts]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void loadViewCounts();
  }, [loadViewCounts]);

  const counts = useMemo(() => {
    if (!tasks)
      return { total: 0, open: 0, done: 0, canceled: 0 };
    return {
      total: tasks.length,
      open: tasks.filter((x) => x.status === "OPEN").length,
      done: tasks.filter((x) => x.status === "DONE").length,
      canceled: tasks.filter((x) => x.status === "CANCELED").length,
    };
  }, [tasks]);

  async function handleToggleDone(task: TaskDto) {
    try {
      await api.tasks.update(task.id, {
        status: task.status === "DONE" ? "OPEN" : "DONE",
      });
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    }
  }

  async function handleCancel(task: TaskDto) {
    try {
      await api.tasks.update(task.id, { status: "CANCELED" });
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    }
  }

  async function handleToggleImportant(task: TaskDto) {
    const next = !task.is_important;
    setTasks((prev) =>
      prev
        ? prev.map((x) => (x.id === task.id ? { ...x, is_important: next } : x))
        : prev,
    );
    try {
      await api.tasks.update(task.id, { is_important: next });
    } catch (err) {
      toast.error(errorMessage(err, t));
      refresh();
    }
  }

  async function handleCreate(values: {
    title: string;
    notes: string | null;
    priority: "LOW" | "MED" | "HIGH";
    due_date: string | null;
    remind_at: string | null;
    recurrence: "daily" | "weekly" | "monthly" | null;
    group_id: string | null;
    tag_ids: string[];
  }) {
    setCreating(true);
    try {
      await api.tasks.create(values);
      setShowCreate(false);
      toast.success(t("tasks.created"));
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(values: {
    title: string;
    notes: string | null;
    priority: "LOW" | "MED" | "HIGH";
    due_date: string | null;
    remind_at: string | null;
    recurrence: "daily" | "weekly" | "monthly" | null;
    group_id: string | null;
    tag_ids: string[];
  }) {
    if (!editing) return;
    setUpdating(true);
    try {
      await api.tasks.update(editing.id, values);
      setEditing(null);
      toast.success(t("tasks.updated"));
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.tasks.remove(deleteTarget.id);
      toast.success(t("tasks.deleted"));
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    }
  }

  async function handleReorder(orderedIds: string[]) {
    setTasks((prev) => {
      if (!prev) return prev;
      const byId = new Map(prev.map((t) => [t.id, t]));
      return orderedIds
        .map((id) => byId.get(id))
        .filter((t): t is TaskDto => t !== undefined);
    });
    try {
      await api.tasks.reorder(orderedIds);
    } catch (err) {
      toast.error(errorMessage(err, t));
      refresh();
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickAdding) return;
    setQuickAdding(true);
    try {
      const group_id =
        groupFilter !== "all" && groupFilter !== "none" ? groupFilter : null;
      await api.tasks.create({ title, group_id });
      setQuickTitle("");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setQuickAdding(false);
    }
  }

  async function handleRestore(task: TaskDto) {
    setTasks((prev) => (prev ? prev.filter((x) => x.id !== task.id) : prev));
    try {
      await api.tasks.restore(task.id);
      toast.success(t("tasks.restored"));
    } catch (err) {
      toast.error(errorMessage(err, t));
      refresh();
    }
  }

  const rowHandlers = {
    onToggleDone: handleToggleDone,
    onToggleImportant: handleToggleImportant,
    onCancel: handleCancel,
    onEdit: setEditing,
    onDelete: setDeleteTarget,
  };

  return (
    <div>
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        actions={
          !isTrash ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              {t("common.newTask")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 inline-flex items-center gap-1 p-1 rounded-lg bg-[color:var(--color-surface-2)]">
        <button
          onClick={() => setView("active")}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm transition-colors",
            !isTrash
              ? "bg-[color:var(--color-surface)] text-[color:var(--color-fg)] shadow-[var(--shadow-card)]"
              : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
          )}
        >
          <ListChecks size={15} />
          {t("tasks.viewActive")}
        </button>
        <button
          onClick={() => setView("trash")}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm transition-colors",
            isTrash
              ? "bg-[color:var(--color-surface)] text-[color:var(--color-fg)] shadow-[var(--shadow-card)]"
              : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
          )}
        >
          <Trash2 size={15} />
          {t("tasks.viewTrash")}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {!isTrash && (
          <aside className="lg:w-56 shrink-0">
            <GroupSidebar
              groups={groups}
              selected={groupFilter}
              onSelect={(g) => {
                setGroupFilter(g);
                setSmartView("all");
              }}
              onGroupsChanged={loadGroups}
              smartView={smartView}
              onSmartView={(v) => {
                setSmartView(v);
                setGroupFilter("all");
              }}
              search={search}
              onSearch={setSearch}
              counts={viewCounts}
            />
          </aside>
        )}
        <div className="flex-1 min-w-0">

      {!isTrash && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="w-36">
            <Select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Filter)}
            >
              <option value="ALL">{t("tasks.filterAll")}</option>
              <option value="OPEN">{t("tasks.filterOpen")}</option>
              <option value="DONE">{t("tasks.filterDone")}</option>
              <option value="CANCELED">{t("tasks.filterCanceled")}</option>
            </Select>
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "h-10 px-3 rounded-md border inline-flex items-center gap-2 text-sm transition-colors",
              hasDateFilter || showFilters
                ? "border-[color:var(--color-border-strong)] text-[color:var(--color-fg)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
            )}
          >
            <SlidersHorizontal size={15} />
            {t("tasks.dateRange")}
            {hasDateFilter && (
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatus("ALL");
                setFrom("");
                setTo("");
              }}
              className="h-10 px-2 text-sm text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)] transition-colors"
            >
              {t("tasks.resetFilters")}
            </button>
          )}

          <div className="ml-auto inline-flex items-center gap-1 p-1 rounded-lg bg-[color:var(--color-surface-2)] shrink-0">
            <button
              onClick={() => setGroupBy("none")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm transition-colors",
                groupBy === "none"
                  ? "bg-[color:var(--color-surface)] text-[color:var(--color-fg)] shadow-[var(--shadow-card)]"
                  : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
              )}
            >
              <List size={15} />
              {t("tasks.groupByNone")}
            </button>
            <button
              onClick={() => setGroupBy("date")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm transition-colors",
                groupBy === "date"
                  ? "bg-[color:var(--color-surface)] text-[color:var(--color-fg)] shadow-[var(--shadow-card)]"
                  : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
              )}
            >
              <CalendarRange size={15} />
              {t("tasks.groupByDate")}
            </button>
          </div>
        </div>
      )}

      {!isTrash && showFilters && (
        <Card className="mb-3">
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="filter-from">{t("tasks.from")}</Label>
                <DatePicker
                  id="filter-from"
                  value={from || null}
                  onChange={(v) => setFrom(v ?? "")}
                  maxDate={to || undefined}
                />
              </div>
              <div>
                <Label htmlFor="filter-to">{t("tasks.to")}</Label>
                <DatePicker
                  id="filter-to"
                  value={to || null}
                  onChange={(v) => setTo(v ?? "")}
                  minDate={from || undefined}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {isTrash && (
        <p className="mb-3 text-xs text-[color:var(--color-fg-subtle)]">
          {t("tasks.trashHint")}
        </p>
      )}

      <Card>
        {error ? (
          <ErrorState
            message={error}
            onRetry={load}
            retryLabel={t("common.tryAgain")}
          />
        ) : !tasks ? (
          <LoadingState />
        ) : tasks.length === 0 ? (
          <div className="p-6">
            {isTrash ? (
              <EmptyState
                icon={<Trash2 size={18} />}
                title={t("tasks.trashEmptyTitle")}
                description={t("tasks.trashEmptyBody")}
              />
            ) : (
              <EmptyState
                icon={<ListChecks size={18} />}
                title={t("tasks.emptyTitle")}
                description={t("tasks.emptyBody")}
                action={
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus size={16} />
                    {t("common.newTask")}
                  </Button>
                }
              />
            )}
          </div>
        ) : isTrash ? (
          <div>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                trash
                onRestore={handleRestore}
              />
            ))}
          </div>
        ) : canReorder ? (
          <SortableTaskList
            tasks={tasks}
            onReorder={handleReorder}
            {...rowHandlers}
          />
        ) : groupBy === "date" ? (
          <div>
            {sectionizeByDate(tasks).map((section) => (
              <div key={section.key}>
                <div className="px-4 py-2 bg-[color:var(--color-surface-2)]/50 border-b border-[color:var(--color-border)] flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      section.key === "overdue"
                        ? "text-[color:var(--color-danger)]"
                        : "text-[color:var(--color-fg-muted)]",
                    )}
                  >
                    {t(section.labelKey)}
                  </span>
                  <span className="text-xs text-[color:var(--color-fg-subtle)]">
                    {section.tasks.length}
                  </span>
                </div>
                {section.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleDone={handleToggleDone}
                    onCancel={handleCancel}
                    onEdit={setEditing}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleDone={handleToggleDone}
                onCancel={handleCancel}
                onEdit={setEditing}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </Card>

      {!isTrash && tasks && tasks.length > 0 && (
        <div className="mt-2 px-1 text-xs text-[color:var(--color-fg-subtle)]">
          {t("tasks.totalCounts", {
            total: counts.total,
            open: counts.open,
            done: counts.done,
            canceled: counts.canceled,
          })}
        </div>
      )}

      {!isTrash && (
        <form
          onSubmit={handleQuickAdd}
          className="mt-3 flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 focus-within:border-[color:var(--color-border-strong)] transition-colors"
        >
          <Plus
            size={18}
            className="text-[color:var(--color-fg-subtle)] shrink-0"
          />
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={t("tasks.quickAddPlaceholder")}
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-fg-subtle)]"
          />
          {quickTitle.trim() && (
            <Button type="submit" size="sm" disabled={quickAdding}>
              {t("tasks.quickAddBtn")}
            </Button>
          )}
        </form>
      )}
        </div>
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t("tasks.editTitle")}
        description={t("tasks.editSubtitle")}
      >
        {editing && (
          <TaskForm
            initial={editing}
            submitLabel={t("tasks.saveChanges")}
            submitting={updating}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("tasks.deletePromptTitle")}
        description={t("tasks.deletePromptBody")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            {t("tasks.deletePromptLead")}{" "}
            <span className="font-medium text-[color:var(--color-fg)]">
              “{deleteTarget.title}”
            </span>
            .
          </p>
        )}
      </Modal>
    </div>
  );
}
