"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import type { TaskDto, TaskStatus } from "@dayframe/types";
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
import { TaskForm } from "@/components/tasks/task-form";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { toast } from "sonner";

type Filter = "ALL" | TaskStatus;

export default function TasksPage() {
  const { t } = useT();
  const [tasks, setTasks] = useState<TaskDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Filter>("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskDto | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const filters: {
        status?: TaskStatus;
        from?: string;
        to?: string;
      } = {};
      if (status !== "ALL") filters.status = status;
      if (from) filters.from = from;
      if (to) filters.to = to;
      const data = await api.tasks.list(filters);
      setTasks(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("tasks.loadFailed"));
    }
  }, [status, from, to, t]);

  useEffect(() => {
    void load();
  }, [load]);

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
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.updateFailed"),
      );
    }
  }

  async function handleCancel(task: TaskDto) {
    try {
      await api.tasks.update(task.id, { status: "CANCELED" });
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
      toast.success(t("tasks.created"));
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.createFailed"),
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(values: {
    title: string;
    notes: string | null;
    priority: "LOW" | "MED" | "HIGH";
    due_date: string | null;
  }) {
    if (!editing) return;
    setUpdating(true);
    try {
      await api.tasks.update(editing.id, values);
      setEditing(null);
      toast.success(t("tasks.updated"));
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.updateFailed"),
      );
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
      void load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dashboard.updateFailed"),
      );
    }
  }

  return (
    <div>
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            {t("common.newTask")}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="filter-status">{t("tasks.status")}</Label>
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
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setStatus("ALL");
                  setFrom("");
                  setTo("");
                }}
              >
                {t("tasks.resetFilters")}
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-[color:var(--color-fg-subtle)]">
            {t("tasks.totalCounts", {
              total: counts.total,
              open: counts.open,
              done: counts.done,
              canceled: counts.canceled,
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !tasks ? (
          <LoadingState />
        ) : tasks.length === 0 ? (
          <div className="p-6">
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
