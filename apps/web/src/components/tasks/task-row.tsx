"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleDashed,
  ListTree,
  MoreHorizontal,
  Repeat,
  RotateCcw,
  Star,
  X as XIcon,
} from "lucide-react";
import type { TaskDto, TaskPriority, TaskStatus } from "@dayframe/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { shortDate, shortDateTime } from "@/lib/date";
import { useT, type MessageKey } from "@/lib/i18n-context";
import { SubtaskPanel } from "./subtask-panel";

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

/** Row action callbacks, shared so wrappers can forward them without repeating
 *  the prop list (see SortableTaskList). */
export interface TaskRowHandlers {
  onToggleDone?: (t: TaskDto) => void;
  onToggleImportant?: (t: TaskDto) => void;
  onCancel?: (t: TaskDto) => void;
  onEdit?: (t: TaskDto) => void;
  onDelete?: (t: TaskDto) => void;
  onRestore?: (t: TaskDto) => void;
}

export function TaskRow({
  task,
  onToggleDone,
  onToggleImportant,
  onCancel,
  onEdit,
  onDelete,
  onRestore,
  /** Trash mode: show a Restore action, hide edit/cancel/delete and the subtask expander. */
  trash = false,
  /** When false, the subtask expander is hidden (e.g. compact dashboard list). */
  expandable = true,
}: TaskRowHandlers & {
  task: TaskDto;
  trash?: boolean;
  expandable?: boolean;
}) {
  const { t, locale } = useT();
  const done = task.status === "DONE";
  const canceled = task.status === "CANCELED";
  const canExpand = expandable && !trash;

  // Reminder indicator. Overdue = the time has passed and the task is still open.
  const reminderOverdue =
    !!task.remind_at &&
    !done &&
    !canceled &&
    new Date(task.remind_at).getTime() < Date.now();

  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(
    task.subtask_progress ?? { total: 0, done: 0 },
  );
  const hasSubtasks = progress.total > 0;

  return (
    <div className="border-b border-[color:var(--color-border)] last:border-b-0">
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--color-surface-2)]/60 transition-colors",
        )}
      >
        <button
          onClick={() => !trash && onToggleDone?.(task)}
          disabled={trash}
          aria-label={done ? t("tasks.statusOpen") : t("tasks.statusDone")}
          className={cn(
            "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
            trash
              ? "border-[color:var(--color-border)] text-[color:var(--color-fg-subtle)] cursor-default"
              : done
                ? "bg-[color:var(--color-success)] border-[color:var(--color-success)] text-white"
                : canceled
                  ? "border-[color:var(--color-border-strong)] text-[color:var(--color-fg-subtle)]"
                  : "border-[color:var(--color-border-strong)] hover:border-[color:var(--color-fg-muted)]",
          )}
        >
          {!trash && done ? <Check size={12} strokeWidth={3} /> : null}
          {!trash && canceled ? <XIcon size={12} /> : null}
          {!trash && !done && !canceled ? (
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
                "text-sm truncate min-w-0",
                done && "line-through text-[color:var(--color-fg-subtle)]",
                canceled && "line-through text-[color:var(--color-fg-subtle)]",
              )}
            >
              {task.title}
            </p>
            {/* Priority badge is a low-priority signal on phones; hide it on the
                narrowest screens so the title keeps its room. */}
            <span className="hidden xs:inline-flex shrink-0">
              <Badge tone={priorityTone[task.priority]}>
                {t(priorityLabelKey[task.priority])}
              </Badge>
            </span>
            {task.recurrence && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-fg-subtle)] shrink-0"
                title={t("tasks.recurringBadge")}
              >
                <Repeat size={12} />
              </span>
            )}
            {hasSubtasks && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-fg-subtle)] shrink-0">
                <ListTree size={12} />
                {t("tasks.subtasksProgress", {
                  done: progress.done,
                  total: progress.total,
                })}
              </span>
            )}
          </div>
          {/* Meta row: due date + tags. Kept on a second line so the title is
              never squeezed, and visible on mobile where the side column hides. */}
          {(task.tags?.length || task.due_date || task.remind_at) && (
            <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1 sm:hidden">
              {task.due_date && (
                <span className="text-[11px] text-[color:var(--color-fg-subtle)]">
                  {shortDate(task.due_date, locale)}
                </span>
              )}
              {task.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] border border-[color:var(--color-border)]"
                  style={
                    tag.color
                      ? { borderColor: tag.color, color: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {/* Desktop tags inline (second visual row not needed on wide screens) */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-1 hidden sm:flex items-center flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] border border-[color:var(--color-border)]"
                  style={
                    tag.color
                      ? { borderColor: tag.color, color: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {task.notes && (
            <p className="mt-0.5 text-xs text-[color:var(--color-fg-subtle)] truncate">
              {task.notes}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--color-fg-subtle)]">
          {task.remind_at && !trash && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                reminderOverdue &&
                  "text-[color:var(--color-danger)] font-medium",
              )}
              title={t("tasks.remindAtLabel", {
                datetime: shortDateTime(task.remind_at, locale),
              })}
            >
              <Bell size={12} />
              {shortDateTime(task.remind_at, locale)}
            </span>
          )}
          {task.due_date && <span>{shortDate(task.due_date, locale)}</span>}
          <span className="text-[10px] uppercase tracking-wide">
            {t(statusLabelKey[task.status])}
          </span>
        </div>

        {!trash && onToggleImportant && (
          <button
            onClick={() => onToggleImportant(task)}
            aria-label={t("tasks.important")}
            aria-pressed={task.is_important}
            title={t("tasks.important")}
            className={cn(
              "h-7 w-7 rounded-md inline-flex items-center justify-center shrink-0 transition-colors",
              task.is_important
                ? "text-amber-500"
                : "text-[color:var(--color-fg-subtle)] opacity-0 group-hover:opacity-100 hover:text-[color:var(--color-fg-muted)]",
            )}
          >
            <Star
              size={16}
              fill={task.is_important ? "currentColor" : "none"}
            />
          </button>
        )}

        {trash ? (
          <button
            onClick={() => onRestore?.(task)}
            className="text-xs h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] transition-colors"
          >
            <RotateCcw size={13} />
            {t("tasks.restore")}
          </button>
        ) : (
        <div className="flex items-center gap-1">
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
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

          {canExpand && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={t("tasks.subtasksToggle")}
              aria-expanded={expanded}
              className={cn(
                "h-7 w-7 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors",
                hasSubtasks && "text-[color:var(--color-fg-muted)]",
              )}
            >
              <ChevronRight
                size={16}
                className={cn(
                  "transition-transform",
                  expanded && "rotate-90",
                )}
              />
            </button>
          )}
        </div>
        )}
      </div>

      {canExpand && expanded && (
        <SubtaskPanel taskId={task.id} onProgressChange={setProgress} />
      )}
    </div>
  );
}
