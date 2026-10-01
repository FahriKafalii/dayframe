"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
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
import type { TaskDto } from "@dayframe/types";
import { cn } from "@/lib/cn";
import { shortDate, shortDateTime } from "@/lib/date";
import { useT } from "@/lib/i18n-context";
import { SubtaskPanel } from "./subtask-panel";

// Shared so wrappers (e.g. SortableTaskList) can forward every row action
// without re-declaring the prop list.
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
  const hasMeta =
    !!task.due_date ||
    (!!task.remind_at && !trash) ||
    !!task.recurrence ||
    hasSubtasks ||
    !!task.tags?.length;

  return (
    <div className="border-b border-[color:var(--color-border)] last:border-b-0">
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 hover:bg-[color:var(--color-surface-2)]/60 transition-colors",
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

        <div
          className={cn("flex-1 min-w-0", !trash && onEdit && "cursor-pointer")}
          onClick={!trash && onEdit ? () => onEdit(task) : undefined}
        >
          <p
            className={cn(
              "text-sm truncate min-w-0",
              task.priority === "HIGH" &&
                !done &&
                !canceled &&
                "font-medium",
              (done || canceled) &&
                "line-through text-[color:var(--color-fg-subtle)]",
            )}
          >
            {task.title}
          </p>
          {/* Secondary meta line: compact, icon-led signals only. Full details
              (priority, tags, notes) live in the edit panel to keep rows calm. */}
          {hasMeta && (
            <div className="mt-0.5 flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-[color:var(--color-fg-subtle)]">
              {task.due_date && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={11} />
                  {shortDate(task.due_date, locale)}
                </span>
              )}
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
                  <Bell size={11} />
                  {shortDateTime(task.remind_at, locale)}
                </span>
              )}
              {task.recurrence && (
                <span
                  className="inline-flex items-center gap-1"
                  title={t("tasks.recurringBadge")}
                >
                  <Repeat size={11} />
                </span>
              )}
              {hasSubtasks && (
                <span className="inline-flex items-center gap-1">
                  <ListTree size={11} />
                  {t("tasks.subtasksProgress", {
                    done: progress.done,
                    total: progress.total,
                  })}
                </span>
              )}
              {task.tags && task.tags.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1"
                      title={tag.name}
                    >
                      <span
                        className="h-2 w-2 rounded-full bg-[color:var(--color-fg-subtle)]"
                        style={tag.color ? { backgroundColor: tag.color } : undefined}
                      />
                      {tag.name}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}
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
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 hidden sm:flex items-center gap-1 transition-opacity">
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
                // Only a persistent affordance when there are subtasks; otherwise
                // reveal on hover so idle rows stay clean.
                hasSubtasks || expanded
                  ? "text-[color:var(--color-fg-muted)]"
                  : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
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
