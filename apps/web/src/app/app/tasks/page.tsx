"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import type { TaskDto, TaskStatus } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { toast } from "sonner";

type Filter = "ALL" | TaskStatus;

export default function TasksPage() {
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
      setError(err instanceof ApiError ? err.message : "Failed to load tasks");
    }
  }, [status, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    if (!tasks)
      return { total: 0, open: 0, done: 0, canceled: 0 };
    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status === "OPEN").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      canceled: tasks.filter((t) => t.status === "CANCELED").length,
    };
  }, [tasks]);

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

  async function handleCancel(t: TaskDto) {
    try {
      await api.tasks.update(t.id, { status: "CANCELED" });
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
      toast.success("Task updated");
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.tasks.remove(deleteTarget.id);
      toast.success("Task deleted");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything you've committed to do — with status, priority, and due dates."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New task
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Filter)}
              >
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="DONE">Done</option>
                <option value="CANCELED">Canceled</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-from">From</Label>
              <Input
                id="filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter-to">To</Label>
              <Input
                id="filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
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
                Reset filters
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-[color:var(--color-fg-subtle)]">
            {counts.total} total · {counts.open} open · {counts.done} done ·{" "}
            {counts.canceled} canceled
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
              title="No tasks here"
              description="Adjust filters, or capture the next thing you'll do."
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
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit task"
        description="Update title, notes, priority, or due date."
      >
        {editing && (
          <TaskForm
            initial={editing}
            submitLabel="Save changes"
            submitting={updating}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete task?"
        description="This cannot be undone."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            You&apos;re about to delete{" "}
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
