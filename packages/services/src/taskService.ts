import { randomUUID } from "crypto";
import { taskRepository, type TaskFilters } from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";
import type { TaskStatus, TaskPriority } from "@dayframe/models";

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export const taskService = {
  async create(userId: string, input: CreateTaskInput) {
    return taskRepository.create({
      id: randomUUID(),
      user_id: userId,
      title: input.title,
      notes: input.notes ?? null,
      status: "OPEN",
      priority: input.priority ?? "MED",
      due_date: input.due_date ?? null,
      completed_at: null,
    });
  },

  async list(userId: string, filters: TaskFilters = {}) {
    return taskRepository.findAllByUser(userId, filters);
  },

  async getById(userId: string, taskId: string) {
    const task = await taskRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("NOT_FOUND", "Task not found");
    }
    return task;
  },

  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    const existing = await taskRepository.findByIdAndUser(taskId, userId);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    const attrs: Record<string, unknown> = { ...input };

    if (input.status !== undefined) {
      if (input.status === "DONE" && existing.status !== "DONE") {
        attrs.completed_at = new Date();
      } else if (input.status !== "DONE" && existing.status === "DONE") {
        attrs.completed_at = null;
      }
    }

    const updated = await taskRepository.updateByIdAndUser(taskId, userId, attrs);
    return updated;
  },

  async remove(userId: string, taskId: string) {
    const deleted = await taskRepository.deleteByIdAndUser(taskId, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Task not found");
    }
  },
};
