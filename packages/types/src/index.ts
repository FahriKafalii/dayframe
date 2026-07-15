export type TaskStatus = "OPEN" | "DONE" | "CANCELED";
export type TaskPriority = "LOW" | "MED" | "HIGH";

export interface UserDto {
  id: string;
  username: string;
}

export interface TaskDto {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryDto {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  wins: string;
  blockers: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarDayDto {
  date: string;
  journal: {
    exists: boolean;
    mood: number | null;
  };
  tasks: {
    openCount: number;
    doneCount: number;
    canceledCount: number;
    due: Array<{
      id: string;
      title: string;
      status: TaskStatus;
      priority: TaskPriority;
      due_date: string | null;
      completed_at: string | null;
    }>;
  };
}

export interface StatsSummaryDto {
  openTasks: number;
  doneTasksLast7Days: number;
  journalStreakEndingToday: number;
  lastJournalDate: string | null;
}

export interface StatsActivityDayDto {
  date: string;
  created: number;
  done: number;
}

// ============ KASA (Finance) DTOs ============

export type AccountKind =
  | "cash"
  | "checking"
  | "savings"
  | "credit_card"
  | "debit_card"
  | "prepaid"
  | "wallet"
  | "investment"
  | "loan"
  | "gold"
  | "crypto";

export type CategoryType = "income" | "expense" | "transfer" | "saving";

export type TransactionType =
  | "expense"
  | "income"
  | "transfer_out"
  | "transfer_in"
  | "adjustment";

export type TransactionStatus = "planned" | "pending" | "cleared" | "reconciled";

export interface AccountDto {
  id: string;
  name: string;
  kind: AccountKind;
  currency: string;
  opening_balance: string;
  opening_date: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: boolean;
  credit_limit: string | null;
  statement_day: number | null;
  due_day: number | null;
  bank_name: string | null;
  last4: string | null;
  notes: string | null;
  // computed
  current_balance: string;
}

export interface CategoryDto {
  id: string;
  parent_id: string | null;
  key: string;
  type: CategoryType;
  emoji: string | null;
  color: string | null;
  sort_order: number;
  is_system: boolean;
  excluded_from_reports: boolean;
  name: string; // resolved from i18n at API layer
}

export interface CategoryTreeNode extends CategoryDto {
  children: CategoryTreeNode[];
}

export interface TagDto {
  id: string;
  name: string;
  color: string | null;
}

export interface TransactionDto {
  id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  base_amount: string;
  fx_rate_to_base: string | null;
  occurred_at: string;
  status: TransactionStatus;
  payee: string | null;
  note: string | null;
  location: string | null;
  transfer_group_id: string | null;
  installment_parent_id: string | null;
  installment_index: number | null;
  installment_total: number | null;
  tags: TagDto[];
}

export interface KasaDailyPointDto {
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulative_balance: number;
}

export interface KasaBreakdownItemDto {
  category_id: string | null;
  key: string;
  name: string;
  emoji: string | null;
  color: string | null;
  total: number;
  share: number;
}

export interface KasaForecastPointDto {
  date: string;
  baseline: number;
  projected: number;
  is_future: boolean;
}

export interface KasaForecastDto {
  series: KasaForecastPointDto[];
  month_end_projected: number;
  lowest_projected_balance: number;
  lowest_projected_date: string;
  base_currency: string;
}

export interface KasaSummaryDto {
  base_currency: string;
  totals: {
    income_mtd: string;
    expense_mtd: string;
    net_mtd: string;
    total_balance: string;
  };
  account_count: number;
  transaction_count: number;
  recent: TransactionDto[];
}

export interface ApiErrorDto {
  error: {
    code:
      | "VALIDATION"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "INTERNAL";
    message: string;
    details?: unknown;
  };
}
