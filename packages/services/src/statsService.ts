import { taskRepository, journalRepository } from "@dayframe/repositories";
import { AppError } from "@dayframe/lib";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function startOfUtcDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

export const statsService = {
  async getSummary(userId: string) {
    const now = new Date();
    const today = toDateString(now);
    const sevenDaysAgo = subtractDays(now, 7);

    const [openTasks, doneTasksLast7Days, lastJournalDate] = await Promise.all([
      taskRepository.countByStatus(userId, "OPEN"),
      taskRepository.countCompletedSince(userId, sevenDaysAgo),
      journalRepository.getMaxDate(userId),
    ]);

    let journalStreakEndingToday = 0;

    if (lastJournalDate) {
      const dates = await journalRepository.getDatesDesc(userId, today);
      const dateSet = new Set(dates);

      const cursor = new Date(today + "T00:00:00Z");
      while (dateSet.has(toDateString(cursor))) {
        journalStreakEndingToday++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }

    return {
      openTasks,
      doneTasksLast7Days,
      journalStreakEndingToday,
      lastJournalDate,
    };
  },

  async getActivity(userId: string, from: string, to: string) {
    const fromDate = new Date(from + "T00:00:00Z");
    const toDate = new Date(to + "T00:00:00Z");

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new AppError("VALIDATION", "Invalid date range");
    }
    if (fromDate > toDate) {
      throw new AppError("VALIDATION", "`from` must be <= `to`");
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((toDate.getTime() - fromDate.getTime()) / dayMs) + 1;
    if (totalDays > 90) {
      throw new AppError("VALIDATION", "Range cannot exceed 90 days");
    }

    const endExclusive = new Date(toDate.getTime() + dayMs);

    const [createdRows, completedRows] = await Promise.all([
      taskRepository.findCreatedBetween(userId, fromDate, endExclusive),
      taskRepository.findCompletedBetween(userId, fromDate, endExclusive),
    ]);

    const buckets = new Map<string, { created: number; done: number }>();
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(fromDate.getTime() + i * dayMs);
      buckets.set(toDateString(d), { created: 0, done: 0 });
    }

    for (const row of createdRows) {
      const key = toDateString(startOfUtcDay(row.created_at as Date));
      const b = buckets.get(key);
      if (b) b.created++;
    }
    for (const row of completedRows) {
      const completedAt = row.completed_at as Date | null;
      if (!completedAt) continue;
      const key = toDateString(startOfUtcDay(completedAt));
      const b = buckets.get(key);
      if (b) b.done++;
    }

    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      created: v.created,
      done: v.done,
    }));
  },
};
