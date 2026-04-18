import { taskRepository } from "@/repositories/taskRepository";
import { journalRepository } from "@/repositories/journalRepository";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
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
};
