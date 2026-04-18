import { Op } from "sequelize";
import { JournalEntry, type JournalEntryCreationAttributes } from "@/models";
import { getSequelize } from "@/db";

export const journalRepository = {
  async findByUserAndDate(userId: string, date: string) {
    return JournalEntry.findOne({ where: { user_id: userId, date } });
  },

  async upsert(attrs: JournalEntryCreationAttributes) {
    const sequelize = getSequelize();
    return sequelize.transaction(async (t) => {
      const existing = await JournalEntry.findOne({
        where: { user_id: attrs.user_id, date: attrs.date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existing) {
        await existing.update(
          {
            mood: attrs.mood,
            wins: attrs.wins,
            blockers: attrs.blockers,
            notes: attrs.notes,
          },
          { transaction: t },
        );
        return existing;
      }

      return JournalEntry.create(attrs, { transaction: t });
    });
  },

  async findByUserAndDateRange(userId: string, from: string, to: string) {
    return JournalEntry.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: from, [Op.lte]: to },
      },
      order: [["date", "ASC"]],
    });
  },

  async getMaxDate(userId: string): Promise<string | null> {
    const entry = await JournalEntry.findOne({
      where: { user_id: userId },
      order: [["date", "DESC"]],
      attributes: ["date"],
    });
    return entry?.date ?? null;
  },

  async getDatesDesc(userId: string, upToDate: string): Promise<string[]> {
    const entries = await JournalEntry.findAll({
      where: {
        user_id: userId,
        date: { [Op.lte]: upToDate },
      },
      order: [["date", "DESC"]],
      attributes: ["date"],
    });
    return entries.map((e) => e.date);
  },
};
