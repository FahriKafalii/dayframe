import type { Transaction as SeqTransaction } from "sequelize";
import { Account, type AccountCreationAttributes } from "@dayframe/models";

export const accountRepository = {
  async findAllByUser(userId: string) {
    return Account.findAll({
      where: { user_id: userId },
      order: [
        ["sort_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  },

  async findByIdAndUser(
    id: string,
    userId: string,
    options: { transaction?: SeqTransaction } = {},
  ) {
    return Account.findOne({
      where: { id, user_id: userId },
      transaction: options.transaction,
    });
  },

  async create(attrs: AccountCreationAttributes) {
    return Account.create(attrs);
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<AccountCreationAttributes>,
  ) {
    const [count, rows] = await Account.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await Account.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  async maxSortOrder(userId: string): Promise<number> {
    const acc = (await Account.max("sort_order", {
      where: { user_id: userId },
    })) as number | null;
    return acc ?? 0;
  },
};
