export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  // Domain-specific: lets the client reliably detect an overdraft without
  // matching on (localizable) message text.
  | "INSUFFICIENT_FUNDS";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    status: number,
    message: string,
    code: ErrorCode = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, "BAD_REQUEST", details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message, "CONFLICT");
  }
  static validation(message = "Validation failed", details?: unknown) {
    return new ApiError(422, message, "VALIDATION_ERROR", details);
  }
  static internal(message = "Internal server error", details?: unknown) {
    return new ApiError(500, message, "INTERNAL_ERROR", details);
  }
}
