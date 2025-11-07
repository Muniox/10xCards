/**
 * OpenRouter Service
 * Public API exports
 */

// Service will be exported here after implementation
// Types
export type {
  OpenRouterConfig,
  Message,
  JSONSchema,
  ResponseFormat,
  CompletionRequest,
  CompletionResponse,
  SchemaCompletionRequest,
} from './openrouter.types';

// Errors
export {
  OpenRouterError,
  ConfigurationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  APIError,
  TimeoutError,
  JSONParsingError,
} from './openrouter.errors';

// Service class
export { OpenRouterService } from './openrouter.service';
