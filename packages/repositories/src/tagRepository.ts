import { Tag, type TagCreationAttributes } from "@dayframe/models";

export const tagRepository = {
  async findAllByUser(userId: string) {
    return Tag.findAll({
      where: { user_id: userId },
      order: [["name", "ASC"]],
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return Tag.findOne({ where: { id, user_id: userId } });
  },

  async create(attrs: TagCreationAttributes) {
    return Tag.create(attrs);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<TagCreationAttributes>,
  ) {
    const [count, rows] = await Tag.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await Tag.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },
};
