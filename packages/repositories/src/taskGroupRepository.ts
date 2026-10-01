import { fn, col } from "sequelize";
import { TaskGroup, type TaskGroupCreationAttributes } from "@dayframe/models";

export const taskGroupRepository = {
  async findAllByUser(userId: string) {
    return TaskGroup.findAll({
      where: { user_id: userId },
      order: [
        ["position", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return TaskGroup.findOne({ where: { id, user_id: userId } });
  },

  async create(attrs: TaskGroupCreationAttributes) {
    return TaskGroup.create(attrs);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<TaskGroupCreationAttributes>,
  ) {
    const [count, rows] = await TaskGroup.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    // Paranoid destroy; DB cascade soft-deletes are not automatic, so child
    // groups are handled at the service level. Tasks keep their group_id set to
    // null via the FK ON DELETE SET NULL only on hard delete — for soft delete
    // the service detaches tasks explicitly.
    const count = await TaskGroup.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  async maxPosition(userId: string, parentId: string | null): Promise<number> {
    const row = (await TaskGroup.findOne({
      where: { user_id: userId, parent_id: parentId },
      attributes: [[fn("MAX", col("position")), "max"]],
      raw: true,
    })) as { max: number | null } | null;
    return row?.max ?? -1;
  },
};
