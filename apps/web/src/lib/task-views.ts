import type { MessageKey } from "@/lib/i18n-context";

export type SmartView = "all" | "myday" | "important" | "planned";

export const SMART_VIEWS: { key: SmartView; labelKey: MessageKey; icon: string }[] = [
  { key: "myday", labelKey: "tasks.viewMyDay", icon: "sun" },
  { key: "important", labelKey: "tasks.viewImportant", icon: "star" },
  { key: "planned", labelKey: "tasks.viewPlanned", icon: "calendar" },
  { key: "all", labelKey: "tasks.viewAll", icon: "infinity" },
];

export interface SmartFilter {
  important?: boolean;
  due?: "today" | "planned";
  today?: string;
}

/** Server filter for a smart view. `today` is the caller's local YYYY-MM-DD. */
export function buildSmartFilter(view: SmartView, today: string): SmartFilter {
  switch (view) {
    case "myday":
      return { due: "today", today };
    case "important":
      return { important: true };
    case "planned":
      return { due: "planned", today };
    case "all":
      return {};
  }
}
