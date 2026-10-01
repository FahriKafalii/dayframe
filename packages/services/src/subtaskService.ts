import { randomUUID } from "crypto";
import { subtaskRepository, taskRepository } from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  done?: boolean;
}

/** Ensure the parent task exists and belongs to the user before touching subtasks. */
async function assertOwnsTask(userId: string, taskId: string) {
  const task = await taskRepository.findByIdAndUser(taskId, userId);
  if (!task) {
    throw new AppError("NOT_FOUND", "Task not found", {
      reason: "TASK_NOT_FOUND",
    });
  }
}

export const subtaskService = {
  async list(userId: string, taskId: string) {
    await assertOwnsTask(userId, taskId);
    return subtaskRepository.findByTask(taskId, userId);
  },

  async create(userId: string, taskId: string, input: CreateSubtaskInput) {
    await assertOwnsTask(userId, taskId);
    const nextPosition = (await subtaskRepository.maxPosition(taskId, userId)) + 1;
    return subtaskRepository.create({
      id: randomUUID(),
      task_id: taskId,
      user_id: userId,
      title: input.title,
      done: false,
      position: nextPosition,
    });
  },

  async update(
    userId: string,
    taskId: string,
    subtaskId: string,
    input: UpdateSubtaskInput,
  ) {
    await assertOwnsTask(userId, taskId);
    const existing = await subtaskRepository.findByIdAndUser(subtaskId, userId);
    if (!existing || existing.task_id !== taskId) {
      throw new AppError("NOT_FOUND", "Subtask not found", {
        reason: "SUBTASK_NOT_FOUND",
      });
    }
    const updated = await subtaskRepository.updateByIdAndUser(
      subtaskId,
      userId,
      input,
    );
    return updated;
  },

  async remove(userId: string, taskId: string, subtaskId: string) {
    await assertOwnsTask(userId, taskId);
    const existing = await subtaskRepository.findByIdAndUser(subtaskId, userId);
    if (!existing || existing.task_id !== taskId) {
      throw new AppError("NOT_FOUND", "Subtask not found", {
        reason: "SUBTASK_NOT_FOUND",
      });
    }
    await subtaskRepository.deleteByIdAndUser(subtaskId, userId);
  },
};
