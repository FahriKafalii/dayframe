"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TaskDto, TaskPriority } from "@dayframe/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldError, Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n-context";

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
  }) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const { t } = useT();

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("tasks.formTitleRequired")).max(200),
        notes: z.string().max(5000).optional(),
        priority: z.enum(["LOW", "MED", "HIGH"]),
        due_date: z.string().optional(),
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
    },
  });

  useEffect(() => {
    reset({
      title: initial?.title ?? "",
      notes: initial?.notes ?? "",
      priority: (initial?.priority as TaskPriority) ?? "MED",
      due_date: initial?.due_date ?? "",
    });
  }, [initial, reset]);

  async function handle(values: TaskFormValues) {
    await onSubmit({
      title: values.title.trim(),
      notes: values.notes?.trim() ? values.notes.trim() : null,
      priority: values.priority,
      due_date: values.due_date ? values.due_date : null,
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
          <Select id="priority" {...register("priority")}>
            <option value="LOW">{t("tasks.formPrioLow")}</option>
            <option value="MED">{t("tasks.formPrioMed")}</option>
            <option value="HIGH">{t("tasks.formPrioHigh")}</option>
          </Select>
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
