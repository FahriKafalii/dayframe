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
import { enUS, tr } from "date-fns/locale";

type LocaleCode = "en" | "tr";

const locales = { en: enUS, tr } as const;

function loc(l?: LocaleCode) {
  return locales[l ?? "en"];
}

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

export function prettyDate(s: string, l?: LocaleCode): string {
  return format(parseISO(s), "EEEE, MMMM d, yyyy", { locale: loc(l) });
}

export function shortDate(s: string, l?: LocaleCode): string {
  return format(parseISO(s), "MMM d", { locale: loc(l) });
}

export function monthLabel(d: Date, l?: LocaleCode): string {
  return format(d, "MMMM yyyy", { locale: loc(l) });
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
