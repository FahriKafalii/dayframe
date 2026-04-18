"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TaskDto, TaskPriority } from "@dayframe/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FieldError, Label } from "@/components/ui/label";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MED", "HIGH"]),
  due_date: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

export function TaskForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = "Save",
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
  const {
    register,
    handleSubmit,
    reset,
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
          Title
        </Label>
        <Input
          id="title"
          placeholder="What needs doing?"
          autoFocus
          invalid={!!errors.title}
          {...register("title")}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...register("priority")}>
            <option value="LOW">Low</option>
            <option value="MED">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" type="date" {...register("due_date")} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Optional details, context, links…"
          {...register("notes")}
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
