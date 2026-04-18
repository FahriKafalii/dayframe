import { journalRepository } from "@/repositories/journalRepository";
import { taskRepository } from "@/repositories/taskRepository";
import { AppError } from "@/lib/errors";

function daysBetween(from: string, to: string): number {
  const a = Date.parse(from + "T00:00:00Z");
  const b = Date.parse(to + "T00:00:00Z");
  return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1;
}

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export const calendarService = {
  async getRange(userId: string, from: string, to: string) {
    const span = daysBetween(from, to);
    if (span < 1 || span > 366) {
      throw new AppError("VALIDATION", "Date range must be 1–366 days");
    }

    const [journals, tasks] = await Promise.all([
      journalRepository.findByUserAndDateRange(userId, from, to),
      taskRepository.findByUserAndDueDateRange(userId, from, to),
    ]);

    const journalMap = new Map(journals.map((j) => [j.date, j]));

    const tasksByDate = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const d = task.due_date!;
      if (!tasksByDate.has(d)) tasksByDate.set(d, []);
      tasksByDate.get(d)!.push(task);
    }

    const dates = dateRange(from, to);

    return dates.map((date) => {
      const journal = journalMap.get(date);
      const dayTasks = tasksByDate.get(date) ?? [];

      let openCount = 0;
      let doneCount = 0;
      let canceledCount = 0;
      for (const t of dayTasks) {
        if (t.status === "OPEN") openCount++;
        else if (t.status === "DONE") doneCount++;
        else if (t.status === "CANCELED") canceledCount++;
      }

      return {
        date,
        journal: {
          exists: !!journal,
          mood: journal?.mood ?? null,
        },
        tasks: {
          openCount,
          doneCount,
          canceledCount,
          due: dayTasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
            completed_at: t.completed_at,
          })),
        },
      };
    });
  },
};
