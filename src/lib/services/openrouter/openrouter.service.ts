/**
 * OpenRouter Service
 * Service for communication with OpenRouter API for LLM completions
 */

import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  SchemaCompletionRequest,
  ResponseFormat,
  JSONSchema,
} from "./openrouter.types";
import {
  ConfigurationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  APIError,
  TimeoutError,
  JSONParsingError,
  OpenRouterError,
} from "./openrouter.errors";

/**
 * OpenRouter Service Class
 * Handles all communication with OpenRouter API
 */
export class OpenRouterService {
  private readonly config: OpenRouterConfig;
  private readonly baseHeaders: Record<string, string>;
  private readonly baseUrl: string;

  /**
   * Creates a new OpenRouter service instance
   * @param config - Service configuration
   * @throws {ConfigurationError} If configuration is invalid
   */
  constructor(config: OpenRouterConfig) {
    // Validate API key
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new ConfigurationError("API key is required");
    }

    // Set default values
    const baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    const httpReferer = config.httpReferer || "https://10xcards.app";
    const appTitle = config.appTitle || "10xCards";
    const defaultTimeout = config.defaultTimeout || 30000;
    const defaultModel = config.defaultModel || "openai/gpt-4o-mini";

    this.config = {
      ...config,
      baseUrl,
      httpReferer,
      appTitle,
      defaultTimeout,
      defaultModel,
    };

    this.baseUrl = baseUrl;

    // Prepare base headers
    this.baseHeaders = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": httpReferer,
      "X-Title": appTitle,
    };
  }

  /**
   * Get service configuration (read-only)
   * @returns Frozen copy of configuration
   */
  public getConfig(): Readonly<OpenRouterConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Build request body for OpenRouter API
   * @param request - Completion request
   * @returns Request body ready to send
   * @throws {ValidationError} If request parameters are invalid
   */
  private buildRequestBody(request: CompletionRequest): unknown {
    // Validate messages
    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError("Messages array cannot be empty");
    }

    // Validate temperature
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new ValidationError("Temperature must be between 0 and 2", {
          provided: request.temperature,
        });
      }
    }

    // Validate topP
    if (request.topP !== undefined) {
      if (request.topP < 0 || request.topP > 1) {
        throw new ValidationError("topP must be between 0 and 1", {
          provided: request.topP,
        });
      }
    }

    // Validate frequency penalty
    if (request.frequencyPenalty !== undefined) {
      if (request.frequencyPenalty < -2 || request.frequencyPenalty > 2) {
        throw new ValidationError("frequencyPenalty must be between -2 and 2", {
          provided: request.frequencyPenalty,
        });
      }
    }

    // Validate presence penalty
    if (request.presencePenalty !== undefined) {
      if (request.presencePenalty < -2 || request.presencePenalty > 2) {
        throw new ValidationError("presencePenalty must be between -2 and 2", {
          provided: request.presencePenalty,
        });
      }
    }

    // Build request body
    const body: Record<string, unknown> = {
      model: request.model || this.config.defaultModel,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Add optional parameters (camelCase to snake_case mapping)
    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }
    if (request.maxTokens !== undefined) {
      body.max_tokens = request.maxTokens;
    }
    if (request.topP !== undefined) {
      body.top_p = request.topP;
    }
    if (request.frequencyPenalty !== undefined) {
      body.frequency_penalty = request.frequencyPenalty;
    }
    if (request.presencePenalty !== undefined) {
      body.presence_penalty = request.presencePenalty;
    }
    if (request.responseFormat) {
      body.response_format = {
        type: request.responseFormat.type,
        json_schema: {
          name: request.responseFormat.json_schema.name,
          strict: request.responseFormat.json_schema.strict,
          schema: request.responseFormat.json_schema.schema,
        },
      };
    }

    return body;
  }

  /**
   * Execute HTTP request to OpenRouter API
   * @param body - Request body
   * @param timeout - Timeout in milliseconds
   * @returns Raw API response
   * @throws {TimeoutError} If request times out
   * @throws {APIError} If network error occurs
   * @throws {OpenRouterError} If API returns error
   */
  private async executeRequest(body: unknown, timeout: number): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.baseHeaders,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text();
        let errorJson: unknown;
        try {
          errorJson = JSON.parse(errorBody);
        } catch {
          errorJson = { message: errorBody };
        }
        this.handleAPIError(response, errorJson);
      }

      // Return parsed JSON
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Request timed out after ${timeout}ms`, { timeout });
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIError(`Network error: ${error.message}`, 0, { originalError: error });
      }

      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Unknown error
      throw new APIError(`Unexpected error: ${error instanceof Error ? error.message : "Unknown"}`, 0, {
        originalError: error,
      });
    }
  }

  /**
   * Handle API error responses
   * @param response - HTTP response
   * @param errorBody - Parsed error body
   * @throws {ValidationError} For 400 errors
   * @throws {AuthenticationError} For 401 errors
   * @throws {AuthorizationError} For 403 errors
   * @throws {RateLimitError} For 429 errors
   * @throws {APIError} For other errors
   */
  private handleAPIError(response: Response, errorBody: unknown): never {
    const status = response.status;
    const errorMessage = this.extractErrorMessage(errorBody);

    switch (status) {
      case 400:
        throw new ValidationError(`Validation error: ${errorMessage}`, errorBody);
      case 401:
        throw new AuthenticationError(`Authentication failed: ${errorMessage}`, errorBody);
      case 403:
        throw new AuthorizationError(`Authorization failed: ${errorMessage}`, errorBody);
      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          `Rate limit exceeded: ${errorMessage}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          errorBody
        );
      }
      default:
        throw new APIError(`API error (${status}): ${errorMessage}`, status, errorBody);
    }
  }

  /**
   * Extract error message from error body
   * @param errorBody - Error response body
   * @returns Extracted error message
   */
  private extractErrorMessage(errorBody: unknown): string {
    if (typeof errorBody === "object" && errorBody !== null) {
      const err = errorBody as Record<string, unknown>;
      if (typeof err.error === "string") {
        return err.error;
      }
      if (typeof err.message === "string") {
        return err.message;
      }
      if (typeof err.error === "object" && err.error !== null) {
        const nestedErr = err.error as Record<string, unknown>;
        if (typeof nestedErr.message === "string") {
          return nestedErr.message;
        }
      }
    }
    return "Unknown error";
  }

  /**
   * Parse raw API response
   * @param rawResponse - Raw response from API
   * @param responseFormat - Expected response format
   * @returns Parsed completion response
   * @throws {ValidationError} If response structure is invalid
   */
  private parseResponse<T>(rawResponse: unknown, responseFormat?: ResponseFormat): CompletionResponse<T> {
    // Validate response structure
    if (typeof rawResponse !== "object" || rawResponse === null) {
      throw new ValidationError("Invalid response structure from API");
    }

    const response = rawResponse as Record<string, unknown>;

    // Validate choices
    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      throw new ValidationError("No choices in API response");
    }

    const choice = response.choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown> | undefined;

    if (!message || typeof message.content !== "string") {
      throw new ValidationError("Invalid message structure in API response");
    }

    const content = message.content;

    // Parse content
    let parsedContent: T;
    if (responseFormat) {
      parsedContent = this.validateJSONResponse<T>(content, responseFormat.json_schema.schema);
    } else {
      parsedContent = content as T;
    }

    // Extract usage
    const usage = response.usage as Record<string, unknown> | undefined;
    const usageData = {
      promptTokens: (usage?.prompt_tokens as number) || 0,
      completionTokens: (usage?.completion_tokens as number) || 0,
      totalTokens: (usage?.total_tokens as number) || 0,
    };

    // Extract finish_reason
    const finishReason = (choice.finish_reason as string) || "stop";

    return {
      content: parsedContent,
      model: (response.model as string) || "unknown",
      usage: usageData,
      finishReason: finishReason as CompletionResponse["finishReason"],
      raw: rawResponse,
    };
  }

  /**
   * Validate and parse JSON response
   * @param content - Response content string
   * @param schema - Optional JSON schema for validation
   * @returns Parsed JSON object
   * @throws {JSONParsingError} If JSON is invalid or doesn't match schema
   */
  private validateJSONResponse<T>(content: string, schema?: JSONSchema): T {
    // Extract JSON from markdown code blocks if present
    let jsonString = content.trim();

    // Remove markdown code block if exists
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Extract JSON object or array
    const jsonMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    // Parse JSON
    let parsed: T;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new JSONParsingError(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
        { content, error }
      );
    }

    // Optional schema validation (basic)
    if (schema) {
      this.validateAgainstSchema(parsed, schema);
    }

    return parsed;
  }

  /**
   * Validate data against JSON schema
   * @param data - Data to validate
   * @param schema - JSON schema
   * @throws {JSONParsingError} If validation fails
   */
  private validateAgainstSchema(data: unknown, schema: JSONSchema): void {
    // Basic type validation
    const actualType = Array.isArray(data) ? "array" : typeof data;

    if (schema.type === "object" && actualType !== "object") {
      throw new JSONParsingError(`Schema validation failed: expected object, got ${actualType}`);
    }

    if (schema.type === "array" && !Array.isArray(data)) {
      throw new JSONParsingError(`Schema validation failed: expected array, got ${actualType}`);
    }

    // Validate required fields for objects
    if (schema.type === "object" && schema.required && typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      for (const required of schema.required) {
        if (!(required in obj)) {
          throw new JSONParsingError(`Schema validation failed: missing required field "${required}"`);
        }
      }
    }

    // For production use, consider using a JSON Schema validation library
    // such as ajv, zod, or yup for comprehensive validation
  }

  /**
   * Execute a completion request
   * @param request - Completion request
   * @returns Completion response
   * @throws {ValidationError} If request is invalid
   * @throws {OpenRouterError} If API error occurs
   */
  public async complete<T = string>(request: CompletionRequest): Promise<CompletionResponse<T>> {
    // 1. Build request body
    const body = this.buildRequestBody(request);

    // 2. Determine timeout
    const timeout = request.timeout || this.config.defaultTimeout || 30000;

    // 3. Execute request
    const rawResponse = await this.executeRequest(body, timeout);

    // 4. Parse response
    const response = this.parseResponse<T>(rawResponse, request.responseFormat);

    return response;
  }

  /**
   * Execute a completion request with JSON schema
   * @param request - Schema completion request
   * @returns Completion response with typed content
   * @throws {ValidationError} If request is invalid
   * @throws {OpenRouterError} If API error occurs
   */
  public async completeWithSchema<T>(request: SchemaCompletionRequest): Promise<CompletionResponse<T>> {
    // Validate schema name
    if (!request.schemaName || !/^[a-zA-Z0-9_]+$/.test(request.schemaName)) {
      throw new ValidationError("Schema name must contain only letters, numbers, and underscores");
    }

    // Create responseFormat
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: request.schemaName,
        strict: true,
        schema: request.schema,
      },
    };

    // Call complete with responseFormat
    return this.complete<T>({
      ...request,
      responseFormat,
    });
  }
}
