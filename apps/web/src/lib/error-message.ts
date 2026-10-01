import { ApiError } from "./api";
import type { MessageKey } from "./i18n-context";

// Reasons/codes we have a dedicated localized string for under `errors.*`.
const KNOWN = new Set<string>([
  "USERNAME_TAKEN",
  "INVALID_CREDENTIALS",
  "TASK_NOT_FOUND",
  "SUBTASK_NOT_FOUND",
  "VALIDATION",
  "UNAUTHORIZED",
  "NETWORK",
]);

/**
 * Turn any thrown error into a localized, user-facing message.
 *
 * Priority: specific `reason` → generic `code` → generic fallback. This keeps
 * the UI in the user's language and never leaks raw backend English strings.
 */
export function errorMessage(
  err: unknown,
  t: (key: MessageKey) => string,
): string {
  if (err instanceof ApiError) {
    // Prefer the specific reason, then fall back to the HTTP-level code.
    const key = err.reason && KNOWN.has(err.reason) ? err.reason : err.code;
    if (KNOWN.has(key)) {
      return t(`errors.${key}` as MessageKey);
    }
  }
  return t("errors.generic");
}
