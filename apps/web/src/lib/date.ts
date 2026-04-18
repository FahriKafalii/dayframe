import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

export function todayIso(): string {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

export function toIso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function fromIso(s: string): Date {
  return parseISO(s);
}

export function prettyDate(s: string): string {
  return format(parseISO(s), "EEEE, MMMM d, yyyy");
}

export function shortDate(s: string): string {
  return format(parseISO(s), "MMM d");
}

export function monthLabel(d: Date): string {
  return format(d, "MMMM yyyy");
}

export function monthGridDays(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export { addDays, addMonths, isSameDay, subDays, parseISO, format };
