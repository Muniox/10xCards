/**
 * OpenRouter Service Types
 * Type definitions for OpenRouter API integration
 */

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterConfig {
  /** API key for OpenRouter */
  apiKey: string;
  /** Base URL for OpenRouter API (default: https://openrouter.ai/api/v1) */
  baseUrl?: string;
  /** HTTP Referer header for application identification */
  httpReferer?: string;
  /** X-Title header for application identification */
  appTitle?: string;
  /** Default timeout in milliseconds (default: 30000) */
  defaultTimeout?: number;
  /** Default model to use (default: openai/gpt-4o-mini) */
  defaultModel?: string;
}

/**
 * Message in a conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * JSON Schema definition (simplified version)
 */
export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  [key: string]: unknown;
}

/**
 * Response format configuration for structured JSON responses
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

/**
 * Request for LLM completion
 */
export interface CompletionRequest {
  /** Messages to send to the model */
  messages: Message[];
  /** Model to use (overrides default) */
  model?: string;
  /** Temperature for randomness (0.0 - 2.0, default: 0.7) */
  temperature?: number;
  /** Maximum number of tokens in the response */
  maxTokens?: number;
  /** Nucleus sampling parameter (0.0 - 1.0) */
  topP?: number;
  /** Frequency penalty (-2.0 - 2.0) */
  frequencyPenalty?: number;
  /** Presence penalty (-2.0 - 2.0) */
  presencePenalty?: number;
  /** Response format for structured JSON output */
  responseFormat?: ResponseFormat;
  /** Timeout for this specific request (overrides default) */
  timeout?: number;
}

/**
 * Response from LLM completion
 */
export interface CompletionResponse<T = string> {
  /** Generated content (string or parsed JSON) */
  content: T;
  /** Model that was used */
  model: string;
  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Reason why the completion finished */
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  /** Raw response for advanced use cases */
  raw: unknown;
}

/**
 * Request for schema-based completion
 */
export interface SchemaCompletionRequest extends Omit<CompletionRequest, 'responseFormat'> {
  /** JSON Schema for the expected response */
  schema: JSONSchema;
  /** Name for the schema (snake_case, a-z, A-Z, 0-9, underscores) */
  schemaName: string;
}
