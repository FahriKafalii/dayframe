import type {
  AccountDto,
  AccountKind,
  CalendarDayDto,
  CategoryTreeNode,
  CategoryType,
  JournalEntryDto,
  KasaBreakdownItemDto,
  KasaDailyPointDto,
  KasaForecastDto,
  KasaSummaryDto,
  StatsActivityDayDto,
  StatsSummaryDto,
  TaskDto,
  TaskPriority,
  TaskStatus,
  TransactionDto,
  TransactionStatus,
  UserDto,
} from "@dayframe/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let payload: {
      error?: { code: string; message: string; details?: unknown };
    } = {};
    try {
      payload = await response.json();
    } catch {
      /* noop */
    }
    const err = payload.error ?? { code: "UNKNOWN", message: response.statusText };
    throw new ApiError(response.status, err.code, err.message, err.details);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  auth: {
    me: () => apiFetch<UserDto>("/api/auth/me"),
    login: (body: { username: string; password: string }) =>
      apiFetch<UserDto>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    register: (body: {
      username: string;
      password: string;
      displayName?: string;
    }) =>
      apiFetch<UserDto>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    logout: () =>
      apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  },
  tasks: {
    list: (filters?: {
      status?: TaskStatus;
      from?: string;
      to?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const qs = params.toString();
      return apiFetch<TaskDto[]>(`/api/tasks${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiFetch<TaskDto>(`/api/tasks/${id}`),
    create: (body: {
      title: string;
      notes?: string | null;
      priority?: TaskPriority;
      due_date?: string | null;
    }) =>
      apiFetch<TaskDto>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (
      id: string,
      body: Partial<{
        title: string;
        notes: string | null;
        status: TaskStatus;
        priority: TaskPriority;
        due_date: string | null;
      }>,
    ) =>
      apiFetch<TaskDto>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  },
  journal: {
    get: (date: string) => apiFetch<JournalEntryDto>(`/api/journal/${date}`),
    upsert: (
      date: string,
      body: {
        mood?: number | null;
        wins?: string;
        blockers?: string;
        notes?: string | null;
      },
    ) =>
      apiFetch<JournalEntryDto>(`/api/journal/${date}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  calendar: {
    range: (from: string, to: string) =>
      apiFetch<CalendarDayDto[]>(`/api/calendar?from=${from}&to=${to}`),
  },
  stats: {
    summary: () => apiFetch<StatsSummaryDto>("/api/stats/summary"),
    activity: (from: string, to: string) =>
      apiFetch<StatsActivityDayDto[]>(
        `/api/stats/activity?from=${from}&to=${to}`,
      ),
  },
  health: () => apiFetch<{ status: string; db: string }>("/api/health"),
  kasa: {
    summary: () => apiFetch<KasaSummaryDto>("/api/kasa/summary"),
    accounts: {
      list: () => apiFetch<AccountDto[]>("/api/kasa/accounts"),
      get: (id: string) => apiFetch<AccountDto>(`/api/kasa/accounts/${id}`),
      create: (body: {
        name: string;
        kind: AccountKind;
        currency?: string;
        opening_balance?: string;
        color?: string;
        icon?: string;
        credit_limit?: string;
        statement_day?: number;
        due_day?: number;
        bank_name?: string;
        last4?: string;
        notes?: string;
      }) =>
        apiFetch<AccountDto>("/api/kasa/accounts", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (
        id: string,
        body: Partial<{
          name: string;
          currency: string;
          opening_balance: string;
          color: string;
          icon: string;
          credit_limit: string;
          statement_day: number;
          due_day: number;
          bank_name: string;
          last4: string;
          notes: string;
          is_archived: boolean;
          sort_order: number;
        }>,
      ) =>
        apiFetch<AccountDto>(`/api/kasa/accounts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        apiFetch<void>(`/api/kasa/accounts/${id}`, { method: "DELETE" }),
    },
    categories: {
      tree: (params?: { type?: CategoryType; locale?: "tr" | "en" }) => {
        const qs = new URLSearchParams();
        qs.set("shape", "tree");
        if (params?.type) qs.set("type", params.type);
        if (params?.locale) qs.set("locale", params.locale);
        return apiFetch<CategoryTreeNode[]>(`/api/kasa/categories?${qs.toString()}`);
      },
    },
    transactions: {
      list: (filters?: {
        account_id?: string;
        category_id?: string;
        type?: "expense" | "income" | "transfer_out" | "transfer_in" | "adjustment";
        status?: TransactionStatus;
        from?: string;
        to?: string;
        search?: string;
        limit?: number;
        offset?: number;
      }) => {
        const qs = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
        const s = qs.toString();
        return apiFetch<TransactionDto[]>(`/api/kasa/transactions${s ? `?${s}` : ""}`);
      },
      create: (body: {
        account_id: string;
        category_id?: string | null;
        type: "expense" | "income" | "adjustment";
        amount: string;
        currency?: string;
        occurred_at: string;
        status?: TransactionStatus;
        payee?: string;
        note?: string;
        location?: string;
      }) =>
        apiFetch<TransactionDto>("/api/kasa/transactions", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (
        id: string,
        body: Partial<{
          account_id: string;
          category_id: string | null;
          type: "expense" | "income" | "adjustment";
          amount: string;
          currency: string;
          occurred_at: string;
          status: TransactionStatus;
          payee: string;
          note: string;
          location: string;
        }>,
      ) =>
        apiFetch<TransactionDto>(`/api/kasa/transactions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        apiFetch<void>(`/api/kasa/transactions/${id}`, { method: "DELETE" }),
    },
    transfer: (body: {
      from_account_id: string;
      to_account_id: string;
      amount: string;
      to_amount?: string;
      occurred_at: string;
      note?: string;
    }) =>
      apiFetch<{ groupId: string }>("/api/kasa/transfer", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    analytics: {
      daily: (from: string, to: string) =>
        apiFetch<KasaDailyPointDto[]>(
          `/api/kasa/analytics/daily?from=${from}&to=${to}`,
        ),
      breakdown: (params: {
        from: string;
        to: string;
        type?: "expense" | "income";
        locale?: "tr" | "en";
      }) => {
        const qs = new URLSearchParams();
        qs.set("from", params.from);
        qs.set("to", params.to);
        if (params.type) qs.set("type", params.type);
        if (params.locale) qs.set("locale", params.locale);
        return apiFetch<KasaBreakdownItemDto[]>(
          `/api/kasa/analytics/breakdown?${qs.toString()}`,
        );
      },
      forecast: (params?: { horizon?: number; lookback?: number }) => {
        const qs = new URLSearchParams();
        if (params?.horizon) qs.set("horizon", String(params.horizon));
        if (params?.lookback) qs.set("lookback", String(params.lookback));
        const s = qs.toString();
        return apiFetch<KasaForecastDto>(
          `/api/kasa/analytics/forecast${s ? `?${s}` : ""}`,
        );
      },
    },
  },
};
