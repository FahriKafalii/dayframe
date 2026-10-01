import { Op, fn, col } from "sequelize";
import { Task, type TaskCreationAttributes, type TaskStatus } from "@dayframe/models";

export interface TaskFilters {
  status?: TaskStatus;
  from?: string;
  to?: string;
  /** Filter to tasks carrying this tag. Applied in the service layer post-fetch. */
  tag_id?: string;
  /** Filter to tasks in this group. "none" = ungrouped (group_id IS NULL). */
  group_id?: string;
  /** Only starred tasks (Important view). */
  important?: boolean;
  /** Case-insensitive title search. */
  search?: string;
  /** Smart date view (today's local date must be passed as `today`). */
  due?: "today" | "planned" | "overdue";
  /** Local YYYY-MM-DD used by the `due` filter. */
  today?: string;
}

export const taskRepository = {
  async findByIdAndUser(id: string, userId: string) {
    return Task.findOne({ where: { id, user_id: userId } });
  },

  async findAllByUser(userId: string, filters: TaskFilters = {}) {
    const where: Record<string, unknown> = { user_id: userId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.group_id) {
      // "none" selects ungrouped tasks; otherwise a specific group.
      where.group_id = filters.group_id === "none" ? null : filters.group_id;
    }
    if (filters.important) {
      where.is_important = true;
    }
    if (filters.search) {
      where.title = { [Op.iLike]: `%${filters.search}%` };
    }
    if (filters.due && filters.today) {
      // Smart views: today = due today, overdue = due before today (still open),
      // planned = any task with a due date.
      if (filters.due === "today") {
        where.due_date = filters.today;
      } else if (filters.due === "overdue") {
        where.due_date = { [Op.lt]: filters.today };
      } else if (filters.due === "planned") {
        where.due_date = { [Op.ne]: null };
      }
    }
    if (filters.from || filters.to) {
      const dateRange: Record<symbol, string> = {};
      if (filters.from) dateRange[Op.gte] = filters.from;
      if (filters.to) dateRange[Op.lte] = filters.to;
      where[Op.and as unknown as string] = [
        { [Op.or]: [{ due_date: dateRange }, { due_date: null }] },
      ];
    }

    // Manual position first (nulls last), then newest created. Postgres sorts
    // NULLs last for ASC only with NULLS LAST; emulate via COALESCE to a large value.
    return Task.findAll({
      where,
      order: [
        [fn("COALESCE", col("position"), 2147483647), "ASC"],
        ["created_at", "DESC"],
      ],
    });
  },

  /** Smallest position among a user's tasks (for inserting new tasks at the top). */
  async minPosition(userId: string): Promise<number | null> {
    const row = (await Task.findOne({
      where: { user_id: userId },
      attributes: [[fn("MIN", col("position")), "min"]],
      raw: true,
    })) as { min: number | null } | null;
    return row?.min ?? null;
  },

  /** Apply new positions in bulk (reorder). Each row scoped to the user. */
  async setPositions(
    userId: string,
    updates: { id: string; position: number }[],
  ): Promise<void> {
    await Promise.all(
      updates.map((u) =>
        Task.update(
          { position: u.position },
          { where: { id: u.id, user_id: userId } },
        ),
      ),
    );
  },

  /** Soft-deleted tasks only (trash view). Uses paranoid:false + deleted_at NOT NULL. */
  async findDeletedByUser(userId: string) {
    return Task.findAll({
      where: {
        user_id: userId,
        deleted_at: { [Op.ne]: null },
      },
      order: [["deleted_at", "DESC"]],
      paranoid: false,
    });
  },

  /** Restore a soft-deleted task. Returns the restored row, or null if nothing matched. */
  async restoreByIdAndUser(id: string, userId: string) {
    const row = await Task.findOne({
      where: { id, user_id: userId },
      paranoid: false,
    });
    if (!row || row.deleted_at === null) return null;
    await row.restore();
    return row;
  },

  async create(attrs: TaskCreationAttributes) {
    return Task.create(attrs);
  },

  async updateByIdAndUser(id: string, userId: string, attrs: Partial<TaskCreationAttributes>) {
    const [count, rows] = await Task.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await Task.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  async findByUserAndDueDateRange(userId: string, from: string, to: string) {
    return Task.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.gte]: from, [Op.lte]: to },
      },
      order: [["due_date", "ASC"]],
    });
  },

  async findByUserForCalendar(userId: string, from: string, to: string) {
    const fromStart = new Date(from + "T00:00:00.000Z");
    const toEnd = new Date(to + "T23:59:59.999Z");
    return Task.findAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { due_date: { [Op.gte]: from, [Op.lte]: to } },
          {
            due_date: null as unknown as string,
            created_at: { [Op.gte]: fromStart, [Op.lte]: toEnd },
          },
        ],
      },
      order: [["due_date", "ASC"]],
    });
  },

  async countByStatus(userId: string, status: TaskStatus): Promise<number> {
    return Task.count({ where: { user_id: userId, status } });
  },

  async countCompletedSince(userId: string, since: Date): Promise<number> {
    return Task.count({
      where: {
        user_id: userId,
        status: "DONE",
        completed_at: { [Op.gte]: since },
      },
      paranoid: false,
    });
  },

  async findCreatedBetween(userId: string, from: Date, to: Date) {
    return Task.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: from, [Op.lt]: to },
      },
      attributes: ["id", "created_at"],
      paranoid: false,
    });
  },

  async findCompletedBetween(userId: string, from: Date, to: Date) {
    return Task.findAll({
      where: {
        user_id: userId,
        status: "DONE",
        completed_at: { [Op.gte]: from, [Op.lt]: to },
      },
      attributes: ["id", "completed_at"],
      paranoid: false,
    });
  },
};
