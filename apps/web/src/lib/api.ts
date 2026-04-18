import type {
  CalendarDayDto,
  JournalEntryDto,
  StatsSummaryDto,
  TaskDto,
  TaskPriority,
  TaskStatus,
  UserDto,
} from "@dayframe/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

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
  },
  health: () => apiFetch<{ status: string; db: string }>("/api/health"),
};
