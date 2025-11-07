import type { ErrorResponse } from "../../types";

/**
 * Creates a standardized error response
 * @param code - Error code from ErrorResponse type
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional context
 * @returns Response object with JSON error body
 */
export function errorResponse(
  code: ErrorResponse["error"]["code"],
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message, details },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Creates a 400 Bad Request response for validation errors
 */
export function validationError(message: string, details?: Record<string, unknown>): Response {
  return errorResponse("VALIDATION_ERROR", message, 400, details);
}

/**
 * Creates a 404 Not Found response
 */
export function notFoundError(message = "Resource not found"): Response {
  return errorResponse("NOT_FOUND", message, 404);
}

/**
 * Creates a 401 Unauthorized response
 */
export function unauthorizedError(message = "Unauthorized"): Response {
  return errorResponse("UNAUTHORIZED", message, 401);
}

/**
 * Creates a 500 Internal Server Error response
 */
export function internalError(message = "Internal server error", details?: Record<string, unknown>): Response {
  return errorResponse("INTERNAL_ERROR", message, 500, details);
}

/**
 * Creates a 429 Too Many Requests response for rate limiting
 */
export function rateLimitError(message = "Too many requests"): Response {
  return errorResponse("RATE_LIMIT_ERROR", message, 429);
}

/**
 * Creates a 500/503 response for AI service errors
 */
export function aiServiceError(message: string, status = 500, details?: Record<string, unknown>): Response {
  return errorResponse("AI_SERVICE_ERROR", message, status, details);
}
