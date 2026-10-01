import { Op, fn, col, where as sqlWhere } from "sequelize";
import {
  TaskTag,
  TaskTagLink,
  type TaskTagCreationAttributes,
} from "@dayframe/models";

export const taskTagRepository = {
  async findAllByUser(userId: string) {
    return TaskTag.findAll({
      where: { user_id: userId },
      order: [["name", "ASC"]],
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return TaskTag.findOne({ where: { id, user_id: userId } });
  },

  /** Case-insensitive lookup by name within a user (for dedupe on create). */
  async findByNameAndUser(name: string, userId: string) {
    return TaskTag.findOne({
      where: {
        user_id: userId,
        [Op.and]: sqlWhere(fn("lower", col("name")), name.toLowerCase()),
      },
    });
  },

  async create(attrs: TaskTagCreationAttributes) {
    return TaskTag.create(attrs);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<TaskTagCreationAttributes>,
  ) {
    const [count, rows] = await TaskTag.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await TaskTag.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  /** Replace the full set of tag links for a task. */
  async setLinksForTask(taskId: string, tagIds: string[]): Promise<void> {
    await TaskTagLink.destroy({ where: { task_id: taskId } });
    if (tagIds.length > 0) {
      await TaskTagLink.bulkCreate(
        tagIds.map((tag_id) => ({ task_id: taskId, tag_id })),
        { ignoreDuplicates: true },
      );
    }
  },

  /** All tags attached to a set of tasks, grouped by task_id (avoids N+1). */
  async tagsByTasks(
    taskIds: string[],
    userId: string,
  ): Promise<Record<string, { id: string; name: string; color: string | null }[]>> {
    if (taskIds.length === 0) return {};
    const links = (await TaskTagLink.findAll({
      where: { task_id: taskIds },
      raw: true,
    })) as unknown as Array<{ task_id: string; tag_id: string }>;
    if (links.length === 0) return {};

    const tags = await TaskTag.findAll({
      where: { user_id: userId },
      raw: true,
    });
    const tagById = new Map(tags.map((t) => [t.id, t]));

    const map: Record<
      string,
      { id: string; name: string; color: string | null }[]
    > = {};
    for (const link of links) {
      const tag = tagById.get(link.tag_id);
      if (!tag) continue;
      (map[link.task_id] ??= []).push({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      });
    }
    return map;
  },
};
