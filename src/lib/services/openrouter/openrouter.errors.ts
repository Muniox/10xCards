/**
 * OpenRouter Service Error Classes
 * Custom error hierarchy for OpenRouter API integration
 */

/**
 * Base error class for all OpenRouter errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Configuration error - thrown when service configuration is invalid
 */
export class ConfigurationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIGURATION_ERROR", details);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Validation error - thrown when request parameters are invalid
 */
export class ValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error - thrown when API key is invalid or expired (401)
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTHENTICATION_ERROR", details);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error - thrown when access to resource is denied (403)
 */
export class AuthorizationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTHORIZATION_ERROR", details);
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Rate limit error - thrown when API rate limit is exceeded (429)
 */
export class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: unknown
  ) {
    super(message, "RATE_LIMIT_ERROR", details);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * API error - thrown for server-side errors (5xx)
 */
export class APIError extends OpenRouterError {
  constructor(
    message: string,
    public statusCode: number,
    details?: unknown
  ) {
    super(message, "API_ERROR", details);
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Timeout error - thrown when request exceeds timeout limit
 */
export class TimeoutError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "TIMEOUT_ERROR", details);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * JSON parsing error - thrown when response JSON is invalid or doesn't match schema
 */
export class JSONParsingError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "JSON_PARSING_ERROR", details);
    this.name = "JSONParsingError";
    Object.setPrototypeOf(this, JSONParsingError.prototype);
  }
}
