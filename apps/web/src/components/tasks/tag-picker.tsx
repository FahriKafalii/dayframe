"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { TaskTagDto } from "@dayframe/types";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

/**
 * Multi-select tag picker. Shows the user's existing tags as toggleable chips
 * and lets them create a new tag inline (Enter). Controlled via value/onChange
 * (a list of selected tag ids).
 */
export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useT();
  const [tags, setTags] = useState<TaskTagDto[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.taskTags
      .list()
      .then((data) => {
        if (alive) setTags(data);
      })
      .catch(() => {
        /* non-fatal: form still works without existing tags */
      });
    return () => {
      alive = false;
    };
  }, []);

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  }

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name || busy) return;
    // If a tag with this name already exists, just select it.
    const existing = tags.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
      setInput("");
      return;
    }
    setBusy(true);
    try {
      const created = await api.taskTags.create({ name });
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...value, created.id]);
      setInput("");
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => {
            const selected = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={cn(
                  "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs border transition-colors",
                  selected
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] border-[color:var(--color-accent)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)]",
                )}
              >
                {selected && <Check size={12} />}
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[color:var(--color-fg-subtle)] mb-2">
          {t("tasks.tagsNone")}
        </p>
      )}
      <form onSubmit={createTag} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("tasks.tagsAddPlaceholder")}
          className="flex-1 h-9 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none focus:border-[color:var(--color-border-strong)] transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="h-9 w-9 rounded-md bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] inline-flex items-center justify-center disabled:opacity-50 transition-colors"
          aria-label={t("tasks.formTags")}
        >
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}
