import { randomUUID } from "crypto";
import {
  taskRepository,
  subtaskRepository,
  taskTagRepository,
  taskGroupRepository,
  type TaskFilters,
} from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";
import type {
  TaskStatus,
  TaskPriority,
  TaskRecurrence,
} from "@dayframe/models";

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  remind_at?: string | null;
  recurrence?: TaskRecurrence | null;
  group_id?: string | null;
  is_important?: boolean;
  tag_ids?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  remind_at?: string | null;
  recurrence?: TaskRecurrence | null;
  group_id?: string | null;
  is_important?: boolean;
  tag_ids?: string[];
}

/**
 * Filter the given tag ids down to those the user actually owns. Prevents
 * attaching another user's tag id, and silently drops stale/unknown ids.
 */
async function ownedTagIds(userId: string, tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const owned = await taskTagRepository.findAllByUser(userId);
  const ownedSet = new Set(owned.map((t) => t.id));
  return tagIds.filter((id) => ownedSet.has(id));
}

/** Ensure a group id (if given) exists and belongs to the user. */
async function assertOwnsGroup(userId: string, groupId: string | null) {
  if (!groupId) return;
  const group = await taskGroupRepository.findByIdAndUser(groupId, userId);
  if (!group) {
    throw new AppError("VALIDATION", "Group not found");
  }
}

/** Advance a date by one recurrence interval. */
function shiftDate(base: Date, rule: TaskRecurrence): Date {
  const d = new Date(base);
  if (rule === "daily") d.setDate(d.getDate() + 1);
  else if (rule === "weekly") d.setDate(d.getDate() + 7);
  else if (rule === "monthly") d.setMonth(d.getMonth() + 1);
  return d;
}

/** Shift a YYYY-MM-DD date-only string by one interval, preserving the format. */
function shiftDateOnly(iso: string, rule: TaskRecurrence): string {
  const d = shiftDate(new Date(iso + "T00:00:00Z"), rule);
  return d.toISOString().slice(0, 10);
}

export const taskService = {
  async create(userId: string, input: CreateTaskInput) {
    await assertOwnsGroup(userId, input.group_id ?? null);
    // New tasks go to the top of the manual order.
    const min = await taskRepository.minPosition(userId);
    const position = (min ?? 0) - 1000;
    const task = await taskRepository.create({
      id: randomUUID(),
      user_id: userId,
      title: input.title,
      notes: input.notes ?? null,
      status: "OPEN",
      priority: input.priority ?? "MED",
      due_date: input.due_date ?? null,
      position,
      remind_at: input.remind_at ? new Date(input.remind_at) : null,
      recurrence: input.recurrence ?? null,
      group_id: input.group_id ?? null,
      is_important: input.is_important ?? false,
      completed_at: null,
    });
    if (input.tag_ids !== undefined) {
      const ids = await ownedTagIds(userId, input.tag_ids);
      await taskTagRepository.setLinksForTask(task.id, ids);
    }
    return task;
  },

  /**
   * Persist a new manual ordering. `orderedIds` is the full list of task ids in
   * their new order; positions are reassigned as 0,1000,2000,... Only the user's
   * own tasks are affected.
   */
  async reorder(userId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({
      id,
      position: index * 1000,
    }));
    await taskRepository.setPositions(userId, updates);
  },

  async list(userId: string, filters: TaskFilters = {}) {
    let tasks = await taskRepository.findAllByUser(userId, filters);
    if (tasks.length === 0) return tasks;

    const ids = tasks.map((t) => t.id);
    // Attach subtask progress + tags, each in a single grouped query (no N+1).
    const [progress, tagsMap] = await Promise.all([
      subtaskRepository.progressByTasks(ids, userId),
      taskTagRepository.tagsByTasks(ids, userId),
    ]);

    // Optional filter: only tasks carrying the given tag.
    if (filters.tag_id) {
      tasks = tasks.filter((t) =>
        (tagsMap[t.id] ?? []).some((tag) => tag.id === filters.tag_id),
      );
    }

    return tasks.map((task) => {
      const p = progress[task.id];
      const json = task.toJSON() as unknown as Record<string, unknown>;
      json.subtask_progress = p ?? { total: 0, done: 0 };
      json.tags = tagsMap[task.id] ?? [];
      return json;
    });
  },

  async listDeleted(userId: string) {
    return taskRepository.findDeletedByUser(userId);
  },

  async restore(userId: string, taskId: string) {
    const restored = await taskRepository.restoreByIdAndUser(taskId, userId);
    if (!restored) {
      throw new AppError("NOT_FOUND", "Task not found", {
        reason: "TASK_NOT_FOUND",
      });
    }
    return restored;
  },

  async getById(userId: string, taskId: string) {
    const task = await taskRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("NOT_FOUND", "Task not found", {
        reason: "TASK_NOT_FOUND",
      });
    }
    return task;
  },

  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    const existing = await taskRepository.findByIdAndUser(taskId, userId);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Task not found", {
        reason: "TASK_NOT_FOUND",
      });
    }

    if (input.group_id !== undefined) {
      await assertOwnsGroup(userId, input.group_id);
    }

    // tag_ids is not a task column — pull it out and handle links separately.
    const { tag_ids, ...rest } = input;
    const attrs: Record<string, unknown> = { ...rest };

    // remind_at comes in as an ISO string (or null to clear); store as Date.
    if (input.remind_at !== undefined) {
      attrs.remind_at = input.remind_at ? new Date(input.remind_at) : null;
    }

    if (input.status !== undefined) {
      if (input.status === "DONE" && existing.status !== "DONE") {
        attrs.completed_at = new Date();
      } else if (input.status !== "DONE" && existing.status === "DONE") {
        attrs.completed_at = null;
      }
    }

    const updated = await taskRepository.updateByIdAndUser(taskId, userId, attrs);

    // Replace tag links only when tag_ids was explicitly provided.
    if (tag_ids !== undefined) {
      const ids = await ownedTagIds(userId, tag_ids);
      await taskTagRepository.setLinksForTask(taskId, ids);
    }

    // Recurrence: when a recurring task transitions into DONE, spawn the next
    // occurrence (dates shifted forward). The new task carries the rule so it
    // keeps recurring; the completed one stops (its recurrence is cleared).
    const justCompleted =
      input.status === "DONE" && existing.status !== "DONE";
    const rule = existing.recurrence;
    if (justCompleted && rule) {
      const min = await taskRepository.minPosition(userId);
      const next = await taskRepository.create({
        id: randomUUID(),
        user_id: userId,
        title: existing.title,
        notes: existing.notes,
        status: "OPEN",
        priority: existing.priority,
        due_date: existing.due_date
          ? shiftDateOnly(existing.due_date, rule)
          : null,
        position: (min ?? 0) - 1000,
        remind_at: existing.remind_at
          ? shiftDate(existing.remind_at, rule)
          : null,
        recurrence: rule,
        group_id: existing.group_id,
        is_important: existing.is_important,
        completed_at: null,
      });
      // Carry the tags over to the next occurrence.
      const tags = await taskTagRepository.tagsByTasks([taskId], userId);
      const carry = (tags[taskId] ?? []).map((t) => t.id);
      if (carry.length > 0) {
        await taskTagRepository.setLinksForTask(next.id, carry);
      }
      // The completed instance no longer recurs.
      await taskRepository.updateByIdAndUser(taskId, userId, {
        recurrence: null,
      });
    }

    return updated;
  },

  async remove(userId: string, taskId: string) {
    const deleted = await taskRepository.deleteByIdAndUser(taskId, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Task not found", {
        reason: "TASK_NOT_FOUND",
      });
    }
  },
};
