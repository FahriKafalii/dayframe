import { randomUUID } from "crypto";
import { z } from "zod";
import { AppError } from "@dayframe/lib";
import {
  accountRepository,
  categoryRepository,
  transactionRepository,
  type TransactionFilters,
} from "@dayframe/repositories";
import { getSequelize } from "@dayframe/db";
import type {
  TransactionStatus,
  TransactionType,
  Category,
} from "@dayframe/models";

const TX_TYPES: TransactionType[] = [
  "expense",
  "income",
  "transfer_out",
  "transfer_in",
  "adjustment",
];
const TX_STATUSES: TransactionStatus[] = ["planned", "pending", "cleared", "reconciled"];

// Issue 1: strict positive decimal — rejects "00.5", scientific notation, leading zeros.
// Allows "0", "0.5", "100.5000". Caller still enforces > 0 for transfers.
const POSITIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,4})?$/;
const decimalString = z
  .string()
  .regex(POSITIVE_DECIMAL, "Tutar pozitif bir sayı olmalı (en fazla 4 ondalık basamak)");

// Issue 2: ISO 4217-ish currency codes — 3-5 uppercase letters (USD, TRY, USDT, XAU).
const CURRENCY_CODE = /^[A-Z]{3,5}$/;
const currencyCode = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(CURRENCY_CODE, "Geçersiz para birimi kodu (3-5 harf)"));

export const createTransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income", "adjustment"] as ["expense", "income", "adjustment"]),
  amount: decimalString,
  currency: currencyCode.default("TRY"),
  occurred_at: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.enum(TX_STATUSES as [TransactionStatus, ...TransactionStatus[]]).default("cleared"),
  payee: z.string().max(160).optional(),
  note: z.string().max(2000).optional(),
  location: z.string().max(160).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transferSchema = z.object({
  from_account_id: z.string().uuid(),
  to_account_id: z.string().uuid(),
  amount: decimalString,
  to_amount: decimalString.optional(), // for cross-currency
  occurred_at: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  note: z.string().max(2000).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;

// Issue 3: sanity bounds for occurred_at — reject obvious typos / corrupt data
// like 1970-01-01 epochs or dates 100+ years in the future. Future dates ARE
// allowed (planned status) but capped at 5 years forward.
const MIN_OCCURRED_AT_MS = Date.UTC(1990, 0, 1);
function maxOccurredAtMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear() + 5, now.getUTCMonth(), now.getUTCDate());
}

function parseOccurredAt(value: string): Date {
  // Accept ISO datetime or YYYY-MM-DD.
  // For date-only inputs we anchor at 12:00 UTC so timezone shifts don't push the
  // record into the previous/next calendar day for users in TR (UTC+3) or other
  // common offsets. Read paths group by occurred_at and must keep using UTC bounds.
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d = new Date(value + "T12:00:00.000Z");
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) {
    throw new AppError("VALIDATION", "Geçersiz tarih");
  }
  const ms = d.getTime();
  if (ms < MIN_OCCURRED_AT_MS || ms > maxOccurredAtMs()) {
    throw new AppError(
      "VALIDATION",
      "Tarih makul bir aralıkta olmalı (1990 ile bugünden 5 yıl sonrası arası).",
    );
  }
  return d;
}

function assertCategoryMatchesType(
  cat: Category,
  txType: TransactionType,
): void {
  if (txType === "expense" && cat.type !== "expense" && cat.type !== "saving") {
    throw new AppError("VALIDATION", "Bu kategori bir gider için uygun değil");
  }
  if (txType === "income" && cat.type !== "income") {
    throw new AppError("VALIDATION", "Bu kategori bir gelir için uygun değil");
  }
}

export const transactionService = {
  async list(userId: string, filters: TransactionFilters = {}) {
    const txs = await transactionRepository.findAllByUser(userId, filters);
    return txs;
  },

  async get(id: string, userId: string) {
    const tx = await transactionRepository.findByIdAndUser(id, userId);
    if (!tx) throw new AppError("NOT_FOUND", "Transaction not found");
    return tx;
  },

  async create(userId: string, input: CreateTransactionInput) {
    const account = await accountRepository.findByIdAndUser(input.account_id, userId);
    if (!account) throw new AppError("VALIDATION", "Hesap bulunamadı");

    if (input.category_id) {
      const cat = await categoryRepository.findByIdAndUser(input.category_id, userId);
      if (!cat) throw new AppError("VALIDATION", "Kategori bulunamadı");
      assertCategoryMatchesType(cat, input.type);
    }

    const currency = input.currency.toUpperCase();
    // For v1 single-currency: if account currency matches, fx_rate = 1, base_amount = amount
    const fxRate = currency === account.currency ? "1" : "1"; // multi-currency in phase 4
    const baseAmount = input.amount;

    return transactionRepository.create({
      user_id: userId,
      account_id: input.account_id,
      category_id: input.category_id ?? null,
      type: input.type,
      amount: input.amount,
      currency,
      fx_rate_to_base: fxRate,
      base_amount: baseAmount,
      occurred_at: parseOccurredAt(input.occurred_at),
      status: input.status,
      payee: input.payee ?? null,
      note: input.note ?? null,
      location: input.location ?? null,
      transfer_group_id: null,
      installment_parent_id: null,
      installment_index: null,
      installment_total: null,
      recurring_rule_id: null,
      planned_item_id: null,
      reconciled_at: null,
    });
  },

  async update(id: string, userId: string, input: UpdateTransactionInput) {
    const existing = await transactionRepository.findByIdAndUser(id, userId);
    if (!existing) throw new AppError("NOT_FOUND", "Transaction not found");
    if (existing.transfer_group_id) {
      throw new AppError(
        "VALIDATION",
        "Transfer kayıtları doğrudan düzenlenemez. Transferi silip yeniden oluşturun.",
      );
    }

    // Ownership check: if the caller is moving the row to a different account,
    // verify the target account belongs to this user.
    if (input.account_id && input.account_id !== existing.account_id) {
      const targetAccount = await accountRepository.findByIdAndUser(
        input.account_id,
        userId,
      );
      if (!targetAccount) {
        throw new AppError("VALIDATION", "Hesap bulunamadı");
      }
    }

    // Category compatibility: validate against the type that will be in effect
    // after the patch (input.type ?? existing.type).
    const effectiveType = (input.type ?? existing.type) as TransactionType;
    if (input.category_id) {
      const cat = await categoryRepository.findByIdAndUser(input.category_id, userId);
      if (!cat) throw new AppError("VALIDATION", "Kategori bulunamadı");
      if (
        effectiveType === "expense" ||
        effectiveType === "income"
      ) {
        assertCategoryMatchesType(cat, effectiveType);
      }
    } else if (
      input.type &&
      input.category_id === undefined &&
      existing.category_id
    ) {
      // Type changed but category was not touched — make sure existing category
      // still matches the new type, otherwise force the user to clear/replace it.
      const cat = await categoryRepository.findByIdAndUser(existing.category_id, userId);
      if (cat && (effectiveType === "expense" || effectiveType === "income")) {
        assertCategoryMatchesType(cat, effectiveType);
      }
    }

    const patch: Partial<Parameters<typeof transactionRepository.updateByIdAndUser>[2]> = {};
    if (input.account_id) patch.account_id = input.account_id;
    if (input.category_id !== undefined) patch.category_id = input.category_id ?? null;
    if (input.type) patch.type = input.type;
    if (input.amount) {
      patch.amount = input.amount;
      patch.base_amount = input.amount;
    }
    if (input.currency) patch.currency = input.currency.toUpperCase();
    if (input.occurred_at) patch.occurred_at = parseOccurredAt(input.occurred_at);
    if (input.status) patch.status = input.status;
    if (input.payee !== undefined) patch.payee = input.payee ?? null;
    if (input.note !== undefined) patch.note = input.note ?? null;
    if (input.location !== undefined) patch.location = input.location ?? null;

    const updated = await transactionRepository.updateByIdAndUser(id, userId, patch);
    if (!updated) throw new AppError("NOT_FOUND", "Transaction not found");
    return updated;
  },

  async remove(id: string, userId: string) {
    const tx = await transactionRepository.findByIdAndUser(id, userId);
    if (!tx) throw new AppError("NOT_FOUND", "Transaction not found");
    if (tx.transfer_group_id) {
      // Cascade: delete both legs
      await transactionRepository.deleteByTransferGroup(tx.transfer_group_id, userId);
      return;
    }
    const ok = await transactionRepository.deleteByIdAndUser(id, userId);
    if (!ok) throw new AppError("NOT_FOUND", "Transaction not found");
  },

  async transfer(userId: string, input: TransferInput): Promise<{ groupId: string }> {
    if (input.from_account_id === input.to_account_id) {
      throw new AppError("VALIDATION", "Kaynak ve hedef hesap aynı olamaz");
    }

    // Issue 5: regex allows "0" / "0.0000" but a zero-amount transfer is
    // nonsense. Reject it explicitly. Same check on `to_amount` if provided.
    if (Number(input.amount) <= 0) {
      throw new AppError("VALIDATION", "Transfer tutarı sıfırdan büyük olmalı");
    }
    if (input.to_amount !== undefined && Number(input.to_amount) <= 0) {
      throw new AppError("VALIDATION", "Hedef tutar sıfırdan büyük olmalı");
    }

    const groupId = randomUUID();
    const occurredAt = parseOccurredAt(input.occurred_at);
    const fromAmount = input.amount;
    // Cross-currency transfer: caller may pass `to_amount` if the destination
    // account is in a different currency; otherwise we use the same amount.
    // Multi-currency FX is deferred to phase 4 — for v1 we store fx_rate=1 on
    // both legs and let the caller balance the books manually.
    const toAmount = input.to_amount ?? input.amount;

    // Both legs must commit atomically. If either insert fails (FK violation,
    // constraint, etc.) the whole transfer rolls back so the user never sees
    // a half-written balance. Issue 17: account lookup happens INSIDE the same
    // sequelize transaction so a soft-delete racing with a transfer can't slip
    // through (the row would be locked or invisible by the time we read it).
    const sequelize = getSequelize();
    await sequelize.transaction(async (t) => {
      const [from, to] = await Promise.all([
        accountRepository.findByIdAndUser(input.from_account_id, userId, {
          transaction: t,
        }),
        accountRepository.findByIdAndUser(input.to_account_id, userId, {
          transaction: t,
        }),
      ]);
      if (!from || !to) throw new AppError("VALIDATION", "Hesap bulunamadı");
      // Issue 10: archived accounts shouldn't accept new movements.
      if (from.is_archived) {
        throw new AppError(
          "VALIDATION",
          "Arşivlenmiş hesaptan transfer yapılamaz. Önce hesabı arşivden çıkarın.",
        );
      }
      if (to.is_archived) {
        throw new AppError(
          "VALIDATION",
          "Arşivlenmiş hesaba transfer yapılamaz. Önce hesabı arşivden çıkarın.",
        );
      }
      await transactionRepository.bulkCreate(
        [
          {
            id: randomUUID(),
            user_id: userId,
            account_id: from.id,
            category_id: null,
            type: "transfer_out",
            amount: fromAmount,
            currency: from.currency,
            fx_rate_to_base: "1",
            base_amount: fromAmount,
            occurred_at: occurredAt,
            status: "cleared",
            payee: `→ ${to.name}`,
            note: input.note ?? null,
            location: null,
            transfer_group_id: groupId,
            installment_parent_id: null,
            installment_index: null,
            installment_total: null,
            recurring_rule_id: null,
            planned_item_id: null,
            reconciled_at: null,
          },
          {
            id: randomUUID(),
            user_id: userId,
            account_id: to.id,
            category_id: null,
            type: "transfer_in",
            amount: toAmount,
            currency: to.currency,
            fx_rate_to_base: "1",
            base_amount: toAmount,
            occurred_at: occurredAt,
            status: "cleared",
            payee: `← ${from.name}`,
            note: input.note ?? null,
            location: null,
            transfer_group_id: groupId,
            installment_parent_id: null,
            installment_index: null,
            installment_total: null,
            recurring_rule_id: null,
            planned_item_id: null,
            reconciled_at: null,
          },
        ],
        { transaction: t },
      );
    });

    return { groupId };
  },
};

export { TX_TYPES };
