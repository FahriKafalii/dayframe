import { randomUUID } from "crypto";
import { taskGroupRepository } from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";

export interface CreateTaskGroupInput {
  name: string;
  parent_id?: string | null;
  color?: string | null;
}

export interface UpdateTaskGroupInput {
  name?: string;
  parent_id?: string | null;
  color?: string | null;
}

/**
 * Walk up from `startId` following parent_id. Returns true if `targetId` is an
 * ancestor of (or equal to) startId — used to reject moves that would create a
 * cycle (a group cannot become its own descendant's child).
 */
async function isAncestorOrSelf(
  userId: string,
  startId: string,
  targetId: string,
): Promise<boolean> {
  let current: string | null = startId;
  const seen = new Set<string>();
  while (current) {
    if (current === targetId) return true;
    if (seen.has(current)) break; // safety against pre-existing bad data
    seen.add(current);
    const node = await taskGroupRepository.findByIdAndUser(current, userId);
    current = node?.parent_id ?? null;
  }
  return false;
}

/** Validate that a parent id (if given) exists, belongs to the user. */
async function assertParent(userId: string, parentId: string | null) {
  if (!parentId) return;
  const parent = await taskGroupRepository.findByIdAndUser(parentId, userId);
  if (!parent) {
    throw new AppError("VALIDATION", "Parent group not found");
  }
}

export const taskGroupService = {
  async list(userId: string) {
    return taskGroupRepository.findAllByUser(userId);
  },

  async create(userId: string, input: CreateTaskGroupInput) {
    const name = input.name.trim();
    if (!name) throw new AppError("VALIDATION", "Group name is required");
    const parentId = input.parent_id ?? null;
    await assertParent(userId, parentId);
    const nextPos = (await taskGroupRepository.maxPosition(userId, parentId)) + 1;
    return taskGroupRepository.create({
      id: randomUUID(),
      user_id: userId,
      parent_id: parentId,
      name,
      color: input.color ?? null,
      position: nextPos,
    });
  },

  async update(userId: string, groupId: string, input: UpdateTaskGroupInput) {
    const existing = await taskGroupRepository.findByIdAndUser(groupId, userId);
    if (!existing) throw new AppError("NOT_FOUND", "Group not found");

    const attrs: { name?: string; parent_id?: string | null; color?: string | null } =
      {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new AppError("VALIDATION", "Group name is required");
      attrs.name = name;
    }

    if (input.parent_id !== undefined) {
      const newParent = input.parent_id;
      if (newParent === groupId) {
        throw new AppError("VALIDATION", "A group cannot be its own parent");
      }
      await assertParent(userId, newParent);
      // Reject moving a group under one of its own descendants (cycle).
      if (newParent && (await isAncestorOrSelf(userId, newParent, groupId))) {
        throw new AppError("VALIDATION", "Cannot move a group into itself");
      }
      attrs.parent_id = newParent;
    }

    if (input.color !== undefined) attrs.color = input.color;

    return taskGroupRepository.updateByIdAndUser(groupId, userId, attrs);
  },

  async remove(userId: string, groupId: string) {
    const ok = await taskGroupRepository.deleteByIdAndUser(groupId, userId);
    if (!ok) throw new AppError("NOT_FOUND", "Group not found");
    // Tasks in this group keep existing but become ungrouped is handled by the
    // FK ON DELETE SET NULL for hard deletes; for the paranoid soft-delete the
    // group simply disappears from listings and its tasks still reference a
    // (now soft-deleted) group — they show up under "Ungrouped" because the
    // group is filtered out. Child groups are soft-deleted lazily when listed.
  },
};
