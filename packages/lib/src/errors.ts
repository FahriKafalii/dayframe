export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

/**
 * Machine-readable, specific reason for an error, used by the client to pick a
 * localized message. `code` stays generic (drives HTTP status); `reason`
 * disambiguates within a code (e.g. two different 409s). Add new reasons here
 * and a matching `errors.<reason>` string in the web message catalogs.
 */
export type ErrorReason =
  | "USERNAME_TAKEN"
  | "INVALID_CREDENTIALS"
  | "SESSION_INVALID"
  | "SESSION_EXPIRED"
  | "AUTH_REQUIRED"
  | "TASK_NOT_FOUND"
  | "SUBTASK_NOT_FOUND";

const STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly reason?: ErrorReason;
  public readonly statusCode: number;
  public readonly details?: unknown;

  /**
   * Backwards-compatible 3rd argument:
   *  - `new AppError(code, message)`
   *  - `new AppError(code, message, details)`            (legacy — validation issues, etc.)
   *  - `new AppError(code, message, { reason, details })` (preferred — carries a specific reason)
   */
  constructor(
    code: ErrorCode,
    message: string,
    detailsOrOptions?: unknown | { reason?: ErrorReason; details?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS_MAP[code];

    if (
      detailsOrOptions !== null &&
      typeof detailsOrOptions === "object" &&
      ("reason" in detailsOrOptions || "details" in detailsOrOptions)
    ) {
      const opts = detailsOrOptions as {
        reason?: ErrorReason;
        details?: unknown;
      };
      this.reason = opts.reason;
      this.details = opts.details;
    } else {
      this.details = detailsOrOptions;
    }
  }
}
