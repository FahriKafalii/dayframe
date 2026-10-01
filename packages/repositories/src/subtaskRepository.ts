import { fn, col } from "sequelize";
import { Subtask, type SubtaskCreationAttributes } from "@dayframe/models";

export const subtaskRepository = {
  async findByTask(taskId: string, userId: string) {
    return Subtask.findAll({
      where: { task_id: taskId, user_id: userId },
      order: [
        ["position", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return Subtask.findOne({ where: { id, user_id: userId } });
  },

  async create(attrs: SubtaskCreationAttributes) {
    return Subtask.create(attrs);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<SubtaskCreationAttributes>,
  ) {
    const [count, rows] = await Subtask.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await Subtask.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  /** Highest position currently used within a task (for appending new rows). */
  async maxPosition(taskId: string, userId: string): Promise<number> {
    const row = (await Subtask.findOne({
      where: { task_id: taskId, user_id: userId },
      attributes: [[fn("MAX", col("position")), "max"]],
      raw: true,
    })) as { max: number | null } | null;
    return row?.max ?? -1;
  },

  /**
   * Progress counts per task for a set of tasks, in one grouped query (avoids
   * N+1 when rendering the task list). Returns a map of task_id → {total, done}.
   */
  async progressByTasks(
    taskIds: string[],
    userId: string,
  ): Promise<Record<string, { total: number; done: number }>> {
    if (taskIds.length === 0) return {};
    const rows = (await Subtask.findAll({
      where: { task_id: taskIds, user_id: userId },
      attributes: [
        "task_id",
        [fn("COUNT", col("id")), "total"],
        [fn("COUNT", fn("NULLIF", col("done"), false)), "done"],
      ],
      group: ["task_id"],
      raw: true,
    })) as unknown as Array<{ task_id: string; total: string; done: string }>;

    const map: Record<string, { total: number; done: number }> = {};
    for (const r of rows) {
      map[r.task_id] = { total: Number(r.total), done: Number(r.done) };
    }
    return map;
  },
};
