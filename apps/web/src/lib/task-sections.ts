import type { TaskDto } from "@dayframe/types";
import type { MessageKey } from "./i18n-context";

export type SectionKey =
  | "overdue"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "later"
  | "noDate"
  | "done";

export interface TaskSection {
  key: SectionKey;
  labelKey: MessageKey;
  tasks: TaskDto[];
}

const LABELS: Record<SectionKey, MessageKey> = {
  overdue: "tasks.sectionOverdue",
  today: "tasks.sectionToday",
  tomorrow: "tasks.sectionTomorrow",
  thisWeek: "tasks.sectionThisWeek",
  later: "tasks.sectionLater",
  noDate: "tasks.sectionNoDate",
  done: "tasks.sectionDone",
};

const ORDER: SectionKey[] = [
  "overdue",
  "today",
  "tomorrow",
  "thisWeek",
  "later",
  "noDate",
  "done",
];

/** Local YYYY-MM-DD for a Date. */
function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Bucket tasks into date-based sections relative to today (local time).
 * Completed/canceled tasks go to "done" regardless of date. Tasks without a
 * due date land in "noDate". Empty sections are dropped. Ordering inside each
 * section preserves the incoming order (already position-sorted from the API).
 */
export function sectionizeByDate(tasks: TaskDto[]): TaskSection[] {
  const today = new Date();
  const todayStr = localDay(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = localDay(tomorrow);

  // End of the current week window (next 7 days from today, exclusive of today/tomorrow).
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = localDay(weekEnd);

  const buckets: Record<SectionKey, TaskDto[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
    done: [],
  };

  for (const task of tasks) {
    if (task.status === "DONE" || task.status === "CANCELED") {
      buckets.done.push(task);
      continue;
    }
    const due = task.due_date;
    if (!due) {
      buckets.noDate.push(task);
    } else if (due < todayStr) {
      buckets.overdue.push(task);
    } else if (due === todayStr) {
      buckets.today.push(task);
    } else if (due === tomorrowStr) {
      buckets.tomorrow.push(task);
    } else if (due <= weekEndStr) {
      buckets.thisWeek.push(task);
    } else {
      buckets.later.push(task);
    }
  }

  return ORDER.map((key) => ({
    key,
    labelKey: LABELS[key],
    tasks: buckets[key],
  })).filter((s) => s.tasks.length > 0);
}
