import { Op } from "sequelize";
import { Task, type TaskCreationAttributes, type TaskStatus } from "@dayframe/models";

export interface TaskFilters {
  status?: TaskStatus;
  from?: string;
  to?: string;
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
    if (filters.from || filters.to) {
      const dateRange: Record<symbol, string> = {};
      if (filters.from) dateRange[Op.gte] = filters.from;
      if (filters.to) dateRange[Op.lte] = filters.to;
      where[Op.and as unknown as string] = [
        { [Op.or]: [{ due_date: dateRange }, { due_date: null }] },
      ];
    }

    return Task.findAll({ where, order: [["created_at", "DESC"]] });
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
