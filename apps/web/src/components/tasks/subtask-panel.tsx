"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { SubtaskDto } from "@dayframe/types";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export function SubtaskPanel({
  taskId,
  onProgressChange,
}: {
  taskId: string;
  /** Called whenever the subtask set changes so the parent list can update its badge. */
  onProgressChange?: (progress: { total: number; done: number }) => void;
}) {
  const { t } = useT();
  const [items, setItems] = useState<SubtaskDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const report = useCallback(
    (list: SubtaskDto[]) => {
      onProgressChange?.({
        total: list.length,
        done: list.filter((s) => s.done).length,
      });
    },
    [onProgressChange],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.tasks.subtasks.list(taskId);
      setItems(data);
      report(data);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }, [taskId, t, report]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || adding) return;
    setAdding(true);
    try {
      const created = await api.tasks.subtasks.create(taskId, { title: value });
      setItems((prev) => {
        const next = [...(prev ?? []), created];
        report(next);
        return next;
      });
      setTitle("");
      inputRef.current?.focus();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(sub: SubtaskDto) {
    // Optimistic update.
    setItems((prev) => {
      const next = (prev ?? []).map((s) =>
        s.id === sub.id ? { ...s, done: !s.done } : s,
      );
      report(next);
      return next;
    });
    try {
      await api.tasks.subtasks.update(taskId, sub.id, { done: !sub.done });
    } catch (err) {
      // Revert on failure.
      setItems((prev) => {
        const next = (prev ?? []).map((s) =>
          s.id === sub.id ? { ...s, done: sub.done } : s,
        );
        report(next);
        return next;
      });
      toast.error(errorMessage(err, t));
    }
  }

  async function handleDelete(sub: SubtaskDto) {
    const prev = items ?? [];
    setItems((cur) => {
      const next = (cur ?? []).filter((s) => s.id !== sub.id);
      report(next);
      return next;
    });
    try {
      await api.tasks.subtasks.remove(taskId, sub.id);
    } catch (err) {
      setItems(prev);
      report(prev);
      toast.error(errorMessage(err, t));
    }
  }

  return (
    <div className="px-4 pb-3 pt-1 sm:pl-12">
      {error ? (
        <p className="text-xs text-[color:var(--color-danger)] py-2">{error}</p>
      ) : items === null ? (
        <div className="flex items-center gap-2 py-2 text-xs text-[color:var(--color-fg-subtle)]">
          <Loader2 size={14} className="animate-spin" />
        </div>
      ) : (
        <ul className="space-y-0.5">
          {items.length === 0 ? (
            <li className="text-xs text-[color:var(--color-fg-subtle)] py-1.5">
              {t("tasks.subtasksEmpty")}
            </li>
          ) : (
            items.map((sub) => (
              <li
                key={sub.id}
                className="group/sub flex items-center gap-2.5 py-1"
              >
                <button
                  onClick={() => handleToggle(sub)}
                  aria-label={sub.title}
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    sub.done
                      ? "bg-[color:var(--color-success)] border-[color:var(--color-success)] text-white"
                      : "border-[color:var(--color-border-strong)] hover:border-[color:var(--color-fg-muted)]",
                  )}
                >
                  {sub.done ? <Check size={10} strokeWidth={3} /> : null}
                </button>
                <span
                  className={cn(
                    "flex-1 min-w-0 text-sm truncate",
                    sub.done &&
                      "line-through text-[color:var(--color-fg-subtle)]",
                  )}
                >
                  {sub.title}
                </span>
                <button
                  onClick={() => handleDelete(sub)}
                  aria-label={t("tasks.subtasksDelete")}
                  className="h-7 w-7 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] opacity-0 group-hover/sub:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("tasks.subtasksAddPlaceholder")}
          className="flex-1 h-9 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none focus:border-[color:var(--color-border-strong)] transition-colors"
        />
        <button
          type="submit"
          disabled={!title.trim() || adding}
          className="h-9 px-3 rounded-md bg-[color:var(--color-surface-2)] text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
        >
          {adding ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          <span className="hidden sm:inline">{t("tasks.subtasksAdd")}</span>
        </button>
      </form>
    </div>
  );
}
