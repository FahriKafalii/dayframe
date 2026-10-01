"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TaskDto, TaskGroupDto, TaskPriority } from "@dayframe/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldError, Label } from "@/components/ui/label";
import { TagPicker } from "@/components/tasks/tag-picker";
import { api } from "@/lib/api";
import { flattenGroups } from "@/lib/task-groups";
import { useT } from "@/lib/i18n-context";

/** ISO string → value for <input type="datetime-local"> (local time, no seconds). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO string with timezone offset. */
function localInputToIso(local: string): string {
  // `new Date("YYYY-MM-DDTHH:mm")` is interpreted as local time.
  return new Date(local).toISOString();
}

export function TaskForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}: {
  initial?: Partial<TaskDto>;
  onSubmit: (values: {
    title: string;
    notes: string | null;
    priority: TaskPriority;
    due_date: string | null;
    remind_at: string | null;
    recurrence: "daily" | "weekly" | "monthly" | null;
    group_id: string | null;
    tag_ids: string[];
  }) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [tagIds, setTagIds] = useState<string[]>(
    initial?.tags?.map((tag) => tag.id) ?? [],
  );
  const [groupId, setGroupId] = useState<string>(initial?.group_id ?? "");
  const [groups, setGroups] = useState<TaskGroupDto[]>([]);

  useEffect(() => {
    setTagIds(initial?.tags?.map((tag) => tag.id) ?? []);
    setGroupId(initial?.group_id ?? "");
  }, [initial]);

  useEffect(() => {
    let alive = true;
    api.taskGroups
      .list()
      .then((data) => {
        if (alive) setGroups(data);
      })
      .catch(() => {
        /* non-fatal: task can still be created without a group */
      });
    return () => {
      alive = false;
    };
  }, []);

  const flatGroups = useMemo(() => flattenGroups(groups), [groups]);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("tasks.formTitleRequired")).max(200),
        notes: z.string().max(5000).optional(),
        priority: z.enum(["LOW", "MED", "HIGH"]),
        due_date: z.string().optional(),
        remind_at: z.string().optional(),
        recurrence: z.enum(["none", "daily", "weekly", "monthly"]),
      }),
    [t],
  );

  type TaskFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      notes: initial?.notes ?? "",
      priority: (initial?.priority as TaskPriority) ?? "MED",
      due_date: initial?.due_date ?? "",
      remind_at: isoToLocalInput(initial?.remind_at ?? null),
      recurrence: initial?.recurrence ?? "none",
    },
  });

  useEffect(() => {
    reset({
      title: initial?.title ?? "",
      notes: initial?.notes ?? "",
      priority: (initial?.priority as TaskPriority) ?? "MED",
      due_date: initial?.due_date ?? "",
      remind_at: isoToLocalInput(initial?.remind_at ?? null),
    });
  }, [initial, reset]);

  async function handle(values: TaskFormValues) {
    await onSubmit({
      title: values.title.trim(),
      notes: values.notes?.trim() ? values.notes.trim() : null,
      priority: values.priority,
      due_date: values.due_date ? values.due_date : null,
      remind_at: values.remind_at ? localInputToIso(values.remind_at) : null,
      recurrence: values.recurrence === "none" ? null : values.recurrence,
      group_id: groupId || null,
      tag_ids: tagIds,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div>
        <Label htmlFor="title" required>
          {t("tasks.formTitle")}
        </Label>
        <Input
          id="title"
          placeholder={t("tasks.formTitlePlaceholder")}
          autoFocus
          invalid={!!errors.title}
          {...register("title")}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="priority">{t("tasks.formPriority")}</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                id="priority"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="LOW">{t("tasks.formPrioLow")}</option>
                <option value="MED">{t("tasks.formPrioMed")}</option>
                <option value="HIGH">{t("tasks.formPrioHigh")}</option>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="due_date">{t("tasks.formDueDate")}</Label>
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="due_date"
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? "")}
              />
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="remind_at">{t("tasks.formRemindAt")}</Label>
          <Input
            id="remind_at"
            type="datetime-local"
            {...register("remind_at")}
          />
        </div>
        <div>
          <Label htmlFor="recurrence">{t("tasks.formRecurrence")}</Label>
          <Controller
            name="recurrence"
            control={control}
            render={({ field }) => (
              <Select
                id="recurrence"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="none">{t("tasks.recurrenceNone")}</option>
                <option value="daily">{t("tasks.recurrenceDaily")}</option>
                <option value="weekly">{t("tasks.recurrenceWeekly")}</option>
                <option value="monthly">{t("tasks.recurrenceMonthly")}</option>
              </Select>
            )}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-[color:var(--color-fg-subtle)]">
        {t("tasks.formRemindAtHint")}
      </p>
      {flatGroups.length > 0 && (
        <div>
          <Label htmlFor="group_id">{t("tasks.formGroup")}</Label>
          <Select
            id="group_id"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">{t("tasks.formGroupNone")}</option>
            {flatGroups.map(({ group, depth }) => (
              <option key={group.id} value={group.id}>
                {`${"  ".repeat(depth)}${group.name}`}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label>{t("tasks.formTags")}</Label>
        <TagPicker value={tagIds} onChange={setTagIds} />
      </div>
      <div>
        <Label htmlFor="notes">{t("tasks.formNotes")}</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder={t("tasks.formNotesPlaceholder")}
          {...register("notes")}
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? t("common.saving") : (submitLabel ?? t("common.save"))}
        </Button>
      </div>
    </form>
  );
}
