import { z } from "zod";
import { AppError } from "@dayframe/lib";
import { accountRepository, transactionRepository } from "@dayframe/repositories";
import type { AccountKind } from "@dayframe/models";

const ACCOUNT_KINDS: AccountKind[] = [
  "cash",
  "checking",
  "savings",
  "credit_card",
  "debit_card",
  "prepaid",
  "wallet",
  "investment",
  "loan",
  "gold",
  "crypto",
];

// Strict positive decimal: rejects scientific notation, leading zeros ("00.5"),
// and negatives. "0" and "0.5" are allowed; "00", "00.5", "1e3" are not.
const POSITIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,4})?$/;
// Same shape but allows a single leading minus for opening balance.
const SIGNED_DECIMAL = /^-?(0|[1-9]\d*)(\.\d{1,4})?$/;
// ISO 4217 (3 chars) plus common crypto / metal codes up to 5. Uppercase only.
const CURRENCY_CODE = /^[A-Z]{3,5}$/;

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(ACCOUNT_KINDS as [AccountKind, ...AccountKind[]]),
  currency: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(CURRENCY_CODE, "Geçersiz para birimi kodu (3-5 harf)"))
    .default("TRY"),
  opening_balance: z.string().regex(SIGNED_DECIMAL, "Açılış bakiyesi geçersiz").default("0"),
  opening_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
  credit_limit: z.string().regex(POSITIVE_DECIMAL, "Kredi limiti geçersiz").optional(),
  statement_day: z.number().int().min(1).max(31).optional(),
  due_day: z.number().int().min(1).max(31).optional(),
  bank_name: z.string().max(120).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  is_archived: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const accountService = {
  async list(userId: string) {
    return accountRepository.findAllByUser(userId);
  },

  async get(id: string, userId: string) {
    const acc = await accountRepository.findByIdAndUser(id, userId);
    if (!acc) throw new AppError("NOT_FOUND", "Account not found");
    return acc;
  },

  async create(userId: string, input: CreateAccountInput) {
    const sortOrder = (await accountRepository.maxSortOrder(userId)) + 1;
    const isCreditCard = input.kind === "credit_card";
    if (isCreditCard) {
      this.validateCreditCard(input);
      this.validateCreditCardLimit(input.credit_limit);
    }
    // Issue 14: silently null out credit-card-only fields for non-credit-card kinds.
    return accountRepository.create({
      user_id: userId,
      name: input.name,
      kind: input.kind,
      currency: input.currency.toUpperCase(),
      opening_balance: input.opening_balance ?? "0",
      opening_date: input.opening_date ?? null,
      color: input.color ?? null,
      icon: input.icon ?? null,
      sort_order: sortOrder,
      is_archived: false,
      credit_limit: isCreditCard ? input.credit_limit ?? null : null,
      statement_day: isCreditCard ? input.statement_day ?? null : null,
      due_day: isCreditCard ? input.due_day ?? null : null,
      interest_rate: null,
      bank_name: input.bank_name ?? null,
      last4: input.last4 ?? null,
      notes: input.notes ?? null,
    });
  },

  async update(id: string, userId: string, input: UpdateAccountInput) {
    const existing = await this.get(id, userId);
    const merged = { ...existing.get({ plain: true }), ...input };
    if (merged.kind === "credit_card") {
      this.validateCreditCard(merged as Parameters<typeof this.validateCreditCard>[0]);
      this.validateCreditCardLimit(merged.credit_limit ?? null);
    }

    // Issue 6: block currency changes if any transaction exists for this account —
    // mixing currencies post-hoc breaks reporting. User must clear transactions first.
    if (input.currency && input.currency.toUpperCase() !== existing.currency) {
      const txCount = await transactionRepository.countByAccount(userId, id);
      if (txCount > 0) {
        throw new AppError(
          "VALIDATION",
          "Bu hesapta işlem bulunduğu için para birimi değiştirilemez. Önce işlemleri silin veya yeni bir hesap oluşturun.",
        );
      }
    }

    // Issue 14: if kind switches away from credit_card (or stays non-credit-card),
    // null out credit-card-only fields so stale data doesn't leak into UI/reports.
    // We type the patch as Partial<AccountCreationAttributes> (the repo's input
    // shape) so explicit nulls are allowed for nullable columns.
    type AccountUpdatePatch = Parameters<typeof accountRepository.updateByIdAndUser>[2];
    const patch: AccountUpdatePatch = {
      ...(input as AccountUpdatePatch),
      currency: input.currency ? input.currency.toUpperCase() : undefined,
    };
    if (merged.kind !== "credit_card") {
      patch.credit_limit = null;
      patch.statement_day = null;
      patch.due_day = null;
      patch.interest_rate = null;
    }

    const updated = await accountRepository.updateByIdAndUser(id, userId, patch);
    if (!updated) throw new AppError("NOT_FOUND", "Account not found");
    return updated;
  },

  async remove(id: string, userId: string) {
    // Soft-delete only flips `deleted_at`; the FK constraint (onDelete: RESTRICT)
    // never fires because the rows still exist physically. Without an explicit
    // guard the user could end up with transactions that still reference an
    // account hidden from every list/dropdown — orphaned by name. Refuse the
    // delete if any non-deleted transactions exist; user should archive instead.
    const txCount = await transactionRepository.countByAccount(userId, id);
    if (txCount > 0) {
      throw new AppError(
        "CONFLICT",
        "Bu hesaba bağlı işlemler var. Silmek yerine arşivleyin veya işlemleri başka hesaba taşıyın.",
      );
    }
    const ok = await accountRepository.deleteByIdAndUser(id, userId);
    if (!ok) throw new AppError("NOT_FOUND", "Account not found");
  },

  async currentBalance(id: string, userId: string, openingBalance: string) {
    const flow = await transactionRepository.sumByAccount(userId, id);
    return (Number(openingBalance) + Number(flow)).toFixed(2);
  },

  validateCreditCard(input: {
    statement_day?: number | null;
    due_day?: number | null;
  }) {
    const s = input.statement_day;
    const d = input.due_day;
    if (s == null || d == null) return;
    // TR yasal: kesim ile son ödeme arası ≥10 gün
    const diff = (d - s + 30) % 30;
    if (diff !== 0 && diff < 10) {
      throw new AppError(
        "VALIDATION",
        "Hesap kesim ile son ödeme tarihi arası en az 10 gün olmalı.",
      );
    }
  },

  // Issue 4: credit cards must have a positive credit_limit.
  validateCreditCardLimit(creditLimit: string | null | undefined) {
    if (creditLimit == null || creditLimit === "") {
      throw new AppError(
        "VALIDATION",
        "Kredi kartı için kredi limiti zorunludur ve sıfırdan büyük olmalıdır.",
      );
    }
    const n = Number(creditLimit);
    if (!Number.isFinite(n) || n <= 0) {
      throw new AppError(
        "VALIDATION",
        "Kredi kartı limiti sıfırdan büyük olmalıdır.",
      );
    }
  },
};
