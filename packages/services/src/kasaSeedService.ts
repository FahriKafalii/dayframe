import { UniqueConstraintError } from "sequelize";
import {
  KASA_SEED_ACCOUNTS,
  KASA_SEED_CATEGORIES,
  type SeedCategory,
} from "@dayframe/db";
import {
  accountRepository,
  categoryRepository,
} from "@dayframe/repositories";

/**
 * Idempotent seed: ensures the user has the default Kasa categories and a starter account.
 * Safe to call on every Kasa request — short-circuits if already seeded.
 *
 * Race-condition handling: if two parallel requests both pass the `count == 0`
 * check (e.g. dashboard + categories endpoint hit at once on first login), the
 * second one will hit the partial-unique index `categories_user_key_active_idx`
 * on the very first insert. We catch UniqueConstraintError and treat it as
 * "another request already seeded for this user" — safe to ignore.
 */
export const kasaSeedService = {
  async ensureSeeded(userId: string): Promise<{ seeded: boolean }> {
    const existing = await categoryRepository.countForUser(userId);
    if (existing > 0) return { seeded: false };

    try {
      await this.seedCategories(userId);
      await this.seedAccounts(userId);
      return { seeded: true };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        // Another parallel request won the race and already inserted the seed
        // categories. The partial-unique index `categories_user_key_active_idx`
        // guarantees the loser fails on its very first insert (the seed iterates
        // in a deterministic order), so no orphan rows are left behind. Treat
        // this as a soft no-op instead of surfacing a 500 to the user.
        return { seeded: false };
      }
      throw err;
    }
  },

  async seedCategories(userId: string): Promise<void> {
    let order = 0;
    for (const root of KASA_SEED_CATEGORIES) {
      const created = await categoryRepository.create({
        user_id: userId,
        parent_id: null,
        key: root.key,
        type: root.type,
        kind_default: root.kindDefault ?? null,
        emoji: root.emoji,
        color: root.color,
        sort_order: order++,
        is_system: true,
        excluded_from_reports: root.excludedFromReports ?? false,
        i18n: { tr: { name: root.name.tr }, en: { name: root.name.en } },
      });

      let childOrder = 0;
      for (const child of root.children ?? []) {
        await categoryRepository.create({
          user_id: userId,
          parent_id: created.id,
          key: child.key,
          type: child.type,
          kind_default: child.kindDefault ?? null,
          emoji: child.emoji,
          color: child.color,
          sort_order: childOrder++,
          is_system: true,
          excluded_from_reports: child.excludedFromReports ?? false,
          i18n: { tr: { name: child.name.tr }, en: { name: child.name.en } },
        } satisfies Parameters<typeof categoryRepository.create>[0]);
      }
    }
  },

  async seedAccounts(userId: string): Promise<void> {
    let order = 0;
    for (const acc of KASA_SEED_ACCOUNTS) {
      await accountRepository.create({
        user_id: userId,
        name: acc.name.tr, // user can rename; default to TR
        kind: acc.kind,
        currency: acc.currency,
        opening_balance: "0",
        opening_date: null,
        color: acc.color,
        icon: acc.icon,
        sort_order: order++,
        is_archived: false,
        credit_limit: null,
        statement_day: null,
        due_day: null,
        interest_rate: null,
        bank_name: null,
        last4: null,
        notes: null,
      });
    }
  },
};

// Marker so TS keeps the SeedCategory import (used via type-narrowing only)
export type _SeedRoot = SeedCategory;
