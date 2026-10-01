// Single source of truth for which app modules are currently active.
//
// Currently every module is active EXCEPT Kasa (Finance), which is still in the
// codebase but hidden from navigation and blocked by a route guard (see
// AppShell). To re-enable Kasa later, add "kasa" to ACTIVE_MODULES and remove
// "/app/kasa" from DISABLED_PREFIXES — nothing is deleted.
//
// See TODO_MODULE_PLAN.md · Faz 0.

export type ModuleKey =
  | "dashboard"
  | "tasks"
  | "journal"
  | "calendar"
  | "kasa"
  | "settings";

/** Modules the user can currently reach. Kasa is intentionally excluded. */
export const ACTIVE_MODULES: ModuleKey[] = [
  "dashboard",
  "tasks",
  "journal",
  "calendar",
  "settings",
];

/** Where to send the user when they hit a disabled route or the /app root. */
export const HOME_PATH = "/app";

/** Route prefixes that are currently disabled. */
const DISABLED_PREFIXES = ["/app/kasa"];

/**
 * True when the given pathname belongs to a disabled module and should be
 * redirected to HOME_PATH.
 */
export function isDisabledPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return DISABLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
