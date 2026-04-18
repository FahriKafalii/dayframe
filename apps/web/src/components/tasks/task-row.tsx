"use client";

import { Check, CircleDashed, MoreHorizontal, X as XIcon } from "lucide-react";
import type { TaskDto, TaskPriority, TaskStatus } from "@dayframe/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/date";
import { useT, type MessageKey } from "@/lib/i18n-context";

const priorityTone: Record<TaskPriority, "neutral" | "info" | "danger"> = {
  LOW: "neutral",
  MED: "info",
  HIGH: "danger",
};

const priorityLabelKey: Record<TaskPriority, MessageKey> = {
  LOW: "tasks.formPrioLow",
  MED: "tasks.formPrioMed",
  HIGH: "tasks.formPrioHigh",
};

const statusLabelKey: Record<TaskStatus, MessageKey> = {
  OPEN: "tasks.statusOpen",
  DONE: "tasks.statusDone",
  CANCELED: "tasks.statusCanceled",
};

export function TaskRow({
  task,
  onToggleDone,
  onCancel,
  onEdit,
  onDelete,
}: {
  task: TaskDto;
  onToggleDone?: (t: TaskDto) => void;
  onCancel?: (t: TaskDto) => void;
  onEdit?: (t: TaskDto) => void;
  onDelete?: (t: TaskDto) => void;
}) {
  const { t, locale } = useT();
  const done = task.status === "DONE";
  const canceled = task.status === "CANCELED";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-surface-2)]/60 transition-colors",
      )}
    >
      <button
        onClick={() => onToggleDone?.(task)}
        aria-label={done ? t("tasks.statusOpen") : t("tasks.statusDone")}
        className={cn(
          "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
          done
            ? "bg-[color:var(--color-success)] border-[color:var(--color-success)] text-white"
            : canceled
              ? "border-[color:var(--color-border-strong)] text-[color:var(--color-fg-subtle)]"
              : "border-[color:var(--color-border-strong)] hover:border-[color:var(--color-fg-muted)]",
        )}
      >
        {done ? <Check size={12} strokeWidth={3} /> : null}
        {canceled ? <XIcon size={12} /> : null}
        {!done && !canceled ? (
          <CircleDashed
            size={12}
            className="opacity-0 group-hover:opacity-40"
          />
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p
            className={cn(
              "text-sm truncate",
              done && "line-through text-[color:var(--color-fg-subtle)]",
              canceled && "line-through text-[color:var(--color-fg-subtle)]",
            )}
          >
            {task.title}
          </p>
          <Badge tone={priorityTone[task.priority]}>
            {t(priorityLabelKey[task.priority])}
          </Badge>
        </div>
        {task.notes && (
          <p className="mt-0.5 text-xs text-[color:var(--color-fg-subtle)] truncate">
            {task.notes}
          </p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--color-fg-subtle)]">
        {task.due_date && <span>{shortDate(task.due_date, locale)}</span>}
        <span className="text-[10px] uppercase tracking-wide">
          {t(statusLabelKey[task.status])}
        </span>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="text-xs h-7 px-2 rounded-md hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] transition-colors"
          >
            {t("common.edit")}
          </button>
        )}
        {onCancel && task.status === "OPEN" && (
          <button
            onClick={() => onCancel(task)}
            className="text-xs h-7 px-2 rounded-md hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] transition-colors"
          >
            {t("common.cancel")}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task)}
            className="h-7 w-7 rounded-md hover:bg-[color:var(--color-danger-soft)] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-danger)] inline-flex items-center justify-center transition-colors"
            aria-label={t("common.delete")}
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
