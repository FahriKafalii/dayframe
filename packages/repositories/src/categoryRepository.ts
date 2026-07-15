import { Op } from "sequelize";
import {
  Category,
  type CategoryCreationAttributes,
  type CategoryType,
} from "@dayframe/models";

export const categoryRepository = {
  async findAllByUser(userId: string, type?: CategoryType) {
    const where: Record<string, unknown> = { user_id: userId };
    if (type) where.type = type;
    return Category.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return Category.findOne({ where: { id, user_id: userId } });
  },

  async findByKeyAndUser(key: string, userId: string) {
    return Category.findOne({ where: { key, user_id: userId } });
  },

  async create(attrs: CategoryCreationAttributes) {
    return Category.create(attrs);
  },

  async bulkCreate(rows: CategoryCreationAttributes[]) {
    return Category.bulkCreate(rows);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<CategoryCreationAttributes>,
  ) {
    const [count, rows] = await Category.update(attrs, {
      where: { id, user_id: userId, is_system: false },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    // Block deletion of system categories
    const count = await Category.destroy({
      where: { id, user_id: userId, is_system: false },
    });
    return count > 0;
  },

  async countForUser(userId: string): Promise<number> {
    return Category.count({ where: { user_id: userId } });
  },

  async findChildrenOf(parentId: string, userId: string) {
    return Category.findAll({
      where: { user_id: userId, parent_id: parentId },
      order: [["sort_order", "ASC"]],
    });
  },

  async findRoots(userId: string, type?: CategoryType) {
    const where: Record<string, unknown> = {
      user_id: userId,
      parent_id: { [Op.is]: null },
    };
    if (type) where.type = type;
    return Category.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  },
};
