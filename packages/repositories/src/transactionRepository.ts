import { Op, type Order, type Transaction as SeqTransaction } from "sequelize";
import {
  Tag,
  Transaction,
  type TransactionCreationAttributes,
  type TransactionStatus,
  type TransactionType,
} from "@dayframe/models";

export interface TransactionFilters {
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  from?: string; // ISO date
  to?: string; // ISO date
  search?: string;
  limit?: number;
  offset?: number;
}

export const transactionRepository = {
  async findAllByUser(userId: string, filters: TransactionFilters = {}) {
    // We mix string keys and Op.* symbol keys; using a WhereOptions-shaped record
    // and casting at the call site keeps type-safety where it matters.
    const where: Record<string, unknown> & { [Op.or]?: unknown } = {
      user_id: userId,
    };

    if (filters.account_id) where.account_id = filters.account_id;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    if (filters.from || filters.to) {
      const range: Record<symbol, Date> = {};
      if (filters.from) range[Op.gte] = new Date(filters.from + "T00:00:00.000Z");
      if (filters.to) range[Op.lte] = new Date(filters.to + "T23:59:59.999Z");
      where.occurred_at = range;
    }

    if (filters.search) {
      const like = `%${filters.search}%`;
      where[Op.or] = [
        { payee: { [Op.iLike]: like } },
        { note: { [Op.iLike]: like } },
        { location: { [Op.iLike]: like } },
      ];
    }

    const order: Order = [
      ["occurred_at", "DESC"],
      ["created_at", "DESC"],
    ];

    return Transaction.findAll({
      where,
      order,
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
      include: [{ model: Tag, as: "tags", through: { attributes: [] } }],
    });
  },

  async countAllByUser(userId: string): Promise<number> {
    return Transaction.count({ where: { user_id: userId } });
  },

  async findByIdAndUser(id: string, userId: string) {
    return Transaction.findOne({
      where: { id, user_id: userId },
      include: [{ model: Tag, as: "tags", through: { attributes: [] } }],
    });
  },

  async create(
    attrs: TransactionCreationAttributes,
    options: { transaction?: SeqTransaction } = {},
  ) {
    return Transaction.create(attrs, { transaction: options.transaction });
  },

  async bulkCreate(
    rows: TransactionCreationAttributes[],
    options: { transaction?: SeqTransaction } = {},
  ) {
    return Transaction.bulkCreate(rows, { transaction: options.transaction });
  },

  async countByAccount(userId: string, accountId: string): Promise<number> {
    return Transaction.count({
      where: { user_id: userId, account_id: accountId },
    });
  },

  async updateByIdAndUser(
    id: string,
    userId: string,
    attrs: Partial<TransactionCreationAttributes>,
  ) {
    const [count, rows] = await Transaction.update(attrs, {
      where: { id, user_id: userId },
      returning: true,
    });
    return count > 0 ? rows[0] : null;
  },

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const count = await Transaction.destroy({ where: { id, user_id: userId } });
    return count > 0;
  },

  async deleteByTransferGroup(groupId: string, userId: string): Promise<number> {
    return Transaction.destroy({
      where: { transfer_group_id: groupId, user_id: userId },
    });
  },

  /**
   * Single-query batch balance computation for ALL of a user's accounts.
   * Replaces the N+1 `sumByAccount` loop in kasaSummaryService.build for users
   * with many accounts. Returns a Map<accountId, netFlow-as-string>.
   */
  async sumByAllAccounts(userId: string): Promise<Map<string, string>> {
    const rows = await Transaction.findAll({
      where: {
        user_id: userId,
        status: { [Op.in]: ["cleared", "reconciled"] },
      },
      attributes: ["account_id", "type", "amount"],
    });
    const out = new Map<string, number>();
    for (const r of rows) {
      const a = Number(r.amount);
      let delta = 0;
      if (r.type === "income" || r.type === "transfer_in") delta = a;
      else if (r.type === "expense" || r.type === "transfer_out") delta = -a;
      else if (r.type === "adjustment") delta = a;
      out.set(r.account_id, (out.get(r.account_id) ?? 0) + delta);
    }
    const result = new Map<string, string>();
    for (const [k, v] of out.entries()) result.set(k, v.toFixed(4));
    return result;
  },

  async sumByAccount(userId: string, accountId: string) {
    // Returns net flow on the account: (income + transfer_in) − (expense + transfer_out)
    // adjustment uses signed amount.
    // NOTE: paranoid stays true here — soft-deleted transactions must NOT affect
    // the live account balance. Number() loses precision past ~15 decimal digits;
    // acceptable for v1 since amounts are DECIMAL(18,4) and balances rarely exceed 1e12.
    const rows = await Transaction.findAll({
      where: {
        user_id: userId,
        account_id: accountId,
        status: { [Op.in]: ["cleared", "reconciled"] },
      },
      attributes: ["type", "amount"],
    });
    let net = 0;
    for (const r of rows) {
      const a = Number(r.amount);
      if (r.type === "income" || r.type === "transfer_in") net += a;
      else if (r.type === "expense" || r.type === "transfer_out") net -= a;
      else if (r.type === "adjustment") net += a;
    }
    return net.toFixed(4);
  },

  async sumIncomeAndExpense(userId: string, from: Date, to: Date) {
    // Live MTD income/expense for the dashboard. paranoid stays true — soft-deleted
    // rows are excluded so the user sees what's still on the books.
    const rows = await Transaction.findAll({
      where: {
        user_id: userId,
        type: { [Op.in]: ["income", "expense"] },
        status: { [Op.in]: ["cleared", "reconciled"] },
        occurred_at: { [Op.gte]: from, [Op.lt]: to },
      },
      attributes: ["type", "base_amount"],
    });
    let income = 0;
    let expense = 0;
    for (const r of rows) {
      const a = Number(r.base_amount);
      if (r.type === "income") income += a;
      else if (r.type === "expense") expense += a;
    }
    return { income: income.toFixed(2), expense: expense.toFixed(2) };
  },
};
