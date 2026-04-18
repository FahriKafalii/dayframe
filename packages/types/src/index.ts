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
