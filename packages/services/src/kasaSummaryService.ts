import { accountRepository, transactionRepository } from "@dayframe/repositories";
import type { Account, Tag, Transaction } from "@dayframe/models";
import type { AccountDto, KasaSummaryDto, TransactionDto } from "@dayframe/types";
import { accountService } from "./accountService";

function startOfMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function nextMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

interface TxWithTags extends Transaction {
  tags?: Tag[];
}

function txToDto(tx: TxWithTags): TransactionDto {
  return {
    id: tx.id,
    account_id: tx.account_id,
    category_id: tx.category_id,
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    base_amount: tx.base_amount,
    fx_rate_to_base: tx.fx_rate_to_base,
    occurred_at: tx.occurred_at.toISOString(),
    status: tx.status,
    payee: tx.payee,
    note: tx.note,
    location: tx.location,
    transfer_group_id: tx.transfer_group_id,
    installment_parent_id: tx.installment_parent_id,
    installment_index: tx.installment_index,
    installment_total: tx.installment_total,
    tags: (tx.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
  };
}

function accountToDtoSync(
  acc: Account,
  balance: string,
): AccountDto {
  return {
    id: acc.id,
    name: acc.name,
    kind: acc.kind,
    currency: acc.currency,
    opening_balance: acc.opening_balance,
    opening_date: acc.opening_date,
    color: acc.color,
    icon: acc.icon,
    sort_order: acc.sort_order,
    is_archived: acc.is_archived,
    credit_limit: acc.credit_limit,
    statement_day: acc.statement_day,
    due_day: acc.due_day,
    bank_name: acc.bank_name,
    last4: acc.last4,
    notes: acc.notes,
    current_balance: balance,
  };
}

/**
 * Single-account DTO. Prefer `accountsToDtos` for lists — it's one query for
 * all accounts instead of N. This wrapper keeps backward compatibility for
 * single-row callers (PATCH/DELETE responses).
 */
export async function accountToDto(
  acc: Account,
  userId: string,
): Promise<AccountDto> {
  const balance = await accountService.currentBalance(acc.id, userId, acc.opening_balance);
  return accountToDtoSync(acc, balance);
}

/**
 * Batch DTO: 1 query for all balances. Use this on the accounts list endpoint.
 */
export async function accountsToDtos(
  accounts: Account[],
  userId: string,
): Promise<AccountDto[]> {
  const flows = await transactionRepository.sumByAllAccounts(userId);
  return accounts.map((acc) => {
    const flow = Number(flows.get(acc.id) ?? "0");
    const balance = (Number(acc.opening_balance) + flow).toFixed(2);
    return accountToDtoSync(acc, balance);
  });
}

export const kasaSummaryService = {
  async build(userId: string, baseCurrency = "TRY"): Promise<KasaSummaryDto> {
    const monthStart = startOfMonthUtc();
    const monthEnd = nextMonthUtc();

    // Three parallel queries instead of accounts + N×sumByAccount + count.
    const [accounts, mtd, recentRows, flows, txCount] = await Promise.all([
      accountRepository.findAllByUser(userId),
      transactionRepository.sumIncomeAndExpense(userId, monthStart, monthEnd),
      transactionRepository.findAllByUser(userId, { limit: 8 }),
      transactionRepository.sumByAllAccounts(userId),
      transactionRepository.countAllByUser(userId),
    ]);

    let totalBalance = 0;
    for (const acc of accounts) {
      if (acc.is_archived) continue;
      const flow = Number(flows.get(acc.id) ?? "0");
      totalBalance += Number(acc.opening_balance) + flow;
    }

    const net = (Number(mtd.income) - Number(mtd.expense)).toFixed(2);

    return {
      base_currency: baseCurrency,
      totals: {
        income_mtd: mtd.income,
        expense_mtd: mtd.expense,
        net_mtd: net,
        total_balance: totalBalance.toFixed(2),
      },
      account_count: accounts.length,
      transaction_count: txCount,
      recent: recentRows.map(txToDto),
    };
  },

  txToDto,
};
