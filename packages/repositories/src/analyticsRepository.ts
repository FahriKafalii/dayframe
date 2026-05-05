import { Op } from "sequelize";
import { Transaction } from "@dayframe/models";

export const analyticsRepository = {
  /**
   * Cleared/reconciled income & expense transactions for a user in a date range,
   * returning only the columns needed for analytics. Soft-deleted excluded.
   */
  async findIncomeExpenseInRange(userId: string, from: Date, to: Date) {
    return Transaction.findAll({
      where: {
        user_id: userId,
        type: { [Op.in]: ["income", "expense"] },
        status: { [Op.in]: ["cleared", "reconciled"] },
        occurred_at: { [Op.gte]: from, [Op.lt]: to },
      },
      attributes: ["id", "type", "base_amount", "occurred_at", "category_id"],
      order: [["occurred_at", "ASC"]],
    });
  },

  /**
   * Planned/pending future transactions used for forecasting.
   */
  async findPlannedInRange(userId: string, from: Date, to: Date) {
    return Transaction.findAll({
      where: {
        user_id: userId,
        type: { [Op.in]: ["income", "expense"] },
        status: { [Op.in]: ["planned", "pending"] },
        occurred_at: { [Op.gte]: from, [Op.lt]: to },
      },
      attributes: ["id", "type", "base_amount", "occurred_at"],
      order: [["occurred_at", "ASC"]],
    });
  },
};
