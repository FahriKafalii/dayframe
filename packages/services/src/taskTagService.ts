import { randomUUID } from "crypto";
import { taskTagRepository } from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";

export interface CreateTaskTagInput {
  name: string;
  color?: string | null;
}

export interface UpdateTaskTagInput {
  name?: string;
  color?: string | null;
}

export const taskTagService = {
  async list(userId: string) {
    return taskTagRepository.findAllByUser(userId);
  },

  async create(userId: string, input: CreateTaskTagInput) {
    const name = input.name.trim();
    if (!name) {
      throw new AppError("VALIDATION", "Tag name is required");
    }
    const existing = await taskTagRepository.findByNameAndUser(name, userId);
    if (existing) {
      // Idempotent: return the existing tag instead of erroring.
      return existing;
    }
    return taskTagRepository.create({
      id: randomUUID(),
      user_id: userId,
      name,
      color: input.color ?? null,
    });
  },

  async update(userId: string, tagId: string, input: UpdateTaskTagInput) {
    const existing = await taskTagRepository.findByIdAndUser(tagId, userId);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Tag not found");
    }
    const attrs: { name?: string; color?: string | null } = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new AppError("VALIDATION", "Tag name is required");
      const clash = await taskTagRepository.findByNameAndUser(name, userId);
      if (clash && clash.id !== tagId) {
        throw new AppError("CONFLICT", "A tag with this name already exists");
      }
      attrs.name = name;
    }
    if (input.color !== undefined) attrs.color = input.color;
    return taskTagRepository.updateByIdAndUser(tagId, userId, attrs);
  },

  async remove(userId: string, tagId: string) {
    const ok = await taskTagRepository.deleteByIdAndUser(tagId, userId);
    if (!ok) {
      throw new AppError("NOT_FOUND", "Tag not found");
    }
  },
};
