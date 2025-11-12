# OpenRouter Service - Plan Implementacji

## 1. Opis Usługi

Usługa `OpenRouterService` jest dedykowaną klasą odpowiedzialną za komunikację z API OpenRouter w celu generowania odpowiedzi z wykorzystaniem modeli LLM (Large Language Models). Usługa ta będzie implementować najlepsze praktyki bezpieczeństwa, obsługi błędów oraz będzie w pełni typowana z wykorzystaniem TypeScript.

### Główne Cele

- Enkapsulacja logiki komunikacji z OpenRouter API
- Wsparcie dla strukturalnych odpowiedzi JSON (JSON Schema)
- Elastyczna konfiguracja parametrów modelu
- Kompleksowa obsługa błędów z dedykowanymi typami
- Zgodność z architekturą projektu 10xCards

### Korzyści z Refaktoryzacji

Obecnie logika OpenRouter jest rozproszona w funkcji `callOpenRouterAPI` wewnątrz `generation.service.ts`. Wydzielenie jej do osobnej usługi zapewni:

1. **Reużywalność** - możliwość wykorzystania w różnych kontekstach (nie tylko generowanie fiszek)
2. **Testowalność** - łatwiejsze mockowanie i testowanie
3. **Maintainability** - centralna lokalizacja konfiguracji i logiki API
4. **Separation of Concerns** - oddzielenie logiki komunikacji z API od logiki biznesowej

## 2. Opis Konstruktora

```typescript
constructor(config: OpenRouterConfig)
```

### Parametry Konfiguracyjne

```typescript
interface OpenRouterConfig {
  apiKey: string;              // Klucz API OpenRouter
  baseUrl?: string;            // URL bazowy (domyślnie: https://openrouter.ai/api/v1)
  httpReferer?: string;        // HTTP-Referer dla identyfikacji aplikacji
  appTitle?: string;           // X-Title dla identyfikacji aplikacji
  defaultTimeout?: number;     // Domyślny timeout w ms (domyślnie: 30000)
  defaultModel?: string;       // Domyślny model (domyślnie: openai/gpt-4o-mini)
}
```

### Walidacja w Konstruktorze

Konstruktor powinien:
1. Walidować obecność wymaganego klucza API
2. Ustawiać wartości domyślne dla opcjonalnych parametrów
3. Rzucać `ConfigurationError` jeśli konfiguracja jest nieprawidłowa

## 3. Publiczne Metody i Pola

### 3.1. Metoda: `complete`

Podstawowa metoda do wykonywania zapytań do modeli LLM.

```typescript
async complete<T = string>(request: CompletionRequest): Promise<CompletionResponse<T>>
```

#### Parametry

```typescript
interface CompletionRequest {
  // Wiadomości
  messages: Message[];

  // Konfiguracja modelu
  model?: string;                    // Nazwa modelu (nadpisuje domyślny)

  // Parametry generowania
  temperature?: number;              // 0.0 - 2.0 (domyślnie: 0.7)
  maxTokens?: number;               // Maksymalna liczba tokenów odpowiedzi
  topP?: number;                    // Nucleus sampling (0.0 - 1.0)
  frequencyPenalty?: number;        // Penalizacja za powtórzenia (-2.0 - 2.0)
  presencePenalty?: number;         // Penalizacja za obecność tokenów (-2.0 - 2.0)

  // JSON Schema dla strukturalnych odpowiedzi
  responseFormat?: ResponseFormat;

  // Inne
  timeout?: number;                 // Timeout dla tego zapytania (nadpisuje domyślny)
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;           // Nazwa schematu (snake_case, a-z, A-Z, 0-9, podkreślenia)
    strict: boolean;        // Wymuszenie zgodności ze schematem
    schema: JSONSchema;     // Obiekt JSON Schema
  };
}

type JSONSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  // ... inne właściwości JSON Schema
};
```

#### Zwracana Wartość

```typescript
interface CompletionResponse<T = string> {
  // Wygenerowana odpowiedź (string lub sparsowany JSON)
  content: T;

  // Metadane
  model: string;                    // Użyty model
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';

  // Surowa odpowiedź dla zaawansowanych przypadków
  raw: unknown;
}
```

### 3.2. Metoda: `completeWithSchema`

Helper metoda dla zapytań ze strukturalną odpowiedzią JSON.

```typescript
async completeWithSchema<T>(
  request: Omit<CompletionRequest, 'responseFormat'> & {
    schema: JSONSchema;
    schemaName: string;
  }
): Promise<CompletionResponse<T>>
```

Ta metoda automatycznie:
1. Tworzy poprawny obiekt `responseFormat`
2. Parsuje odpowiedź JSON
3. Waliduje zgodność ze schematem (opcjonalnie)

### 3.3. Metoda: `streamComplete`

Metoda do streamowania odpowiedzi (przyszłe rozszerzenie).

```typescript
async *streamComplete(request: CompletionRequest): AsyncGenerator<string, void, unknown>
```

### 3.4. Publiczne Pola

```typescript
readonly config: Readonly<OpenRouterConfig>;  // Dostęp do konfiguracji (tylko odczyt)
```

## 4. Prywatne Metody i Pola

### 4.1. Pole: `baseHeaders`

```typescript
private readonly baseHeaders: Record<string, string>
```

Przechowuje bazowe nagłówki HTTP używane we wszystkich zapytaniach:
- `Authorization: Bearer ${apiKey}`
- `Content-Type: application/json`
- `HTTP-Referer: ${httpReferer}`
- `X-Title: ${appTitle}`

### 4.2. Metoda: `buildRequestBody`

```typescript
private buildRequestBody(request: CompletionRequest): unknown
```

Konstruuje ciało zapytania zgodne z specyfikacją OpenRouter API:

```typescript
{
  model: string;
  messages: Array<{role: string; content: string}>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
    };
  };
}
```

### 4.3. Metoda: `executeRequest`

```typescript
private async executeRequest(
  body: unknown,
  timeout: number
): Promise<unknown>
```

Wykonuje rzeczywiste zapytanie HTTP do OpenRouter API:
1. Tworzy `AbortController` dla timeout
2. Wykonuje `fetch` z odpowiednimi nagłówkami
3. Obsługuje odpowiedź HTTP (status codes)
4. Zwraca surową odpowiedź JSON

### 4.4. Metoda: `parseResponse`

```typescript
private parseResponse<T>(
  rawResponse: unknown,
  responseFormat?: ResponseFormat
): CompletionResponse<T>
```

Parsuje surową odpowiedź z API:
1. Waliduje strukturę odpowiedzi
2. Ekstraktuje `content` z `choices[0].message.content`
3. Jeśli `responseFormat` jest zdefiniowany - parsuje JSON
4. Ekstraktuje `usage` i `finish_reason`
5. Zwraca typowany `CompletionResponse`

### 4.5. Metoda: `validateJSONResponse`

```typescript
private validateJSONResponse<T>(
  content: string,
  schema?: JSONSchema
): T
```

Waliduje i parsuje odpowiedź JSON:
1. Próbuje wyekstraktować JSON z odpowiedzi (obsługa markdown code blocks)
2. Parsuje JSON
3. Opcjonalnie waliduje zgodność ze schematem
4. Zwraca sparsowany obiekt

### 4.6. Metoda: `handleAPIError`

```typescript
private handleAPIError(
  response: Response,
  errorBody: unknown
): never
```

Mapuje błędy HTTP na dedykowane typy błędów:
- 400 → `ValidationError`
- 401 → `AuthenticationError`
- 403 → `AuthorizationError`
- 429 → `RateLimitError`
- 500-599 → `APIError`

## 5. Obsługa Błędów

### 5.1. Hierarchia Błędów

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

class ConfigurationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

class ValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: unknown
  ) {
    super(message, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}

class APIError extends OpenRouterError {
  constructor(
    message: string,
    public statusCode: number,
    details?: unknown
  ) {
    super(message, 'API_ERROR', details);
    this.name = 'APIError';
  }
}

class TimeoutError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

class JSONParsingError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'JSON_PARSING_ERROR', details);
    this.name = 'JSONParsingError';
  }
}
```

### 5.2. Scenariusze Błędów

1. **Błąd Konfiguracji**
   - Brak klucza API
   - Nieprawidłowy URL bazowy
   - **Rzuca**: `ConfigurationError`

2. **Błąd Walidacji Zapytania**
   - Pusta lista wiadomości
   - Nieprawidłowe parametry (np. `temperature` poza zakresem)
   - Nieprawidłowy format JSON Schema
   - **Rzuca**: `ValidationError`

3. **Błąd Autentykacji (401)**
   - Nieprawidłowy lub wygasły klucz API
   - **Rzuca**: `AuthenticationError`

4. **Błąd Autoryzacji (403)**
   - Brak dostępu do modelu
   - Przekroczony limit finansowy
   - **Rzuca**: `AuthorizationError`

5. **Błąd Rate Limit (429)**
   - Przekroczony limit zapytań
   - **Rzuca**: `RateLimitError` (z `retryAfter` jeśli dostępne)

6. **Błąd API (5xx)**
   - Problemy po stronie serwera OpenRouter
   - **Rzuca**: `APIError`

7. **Timeout**
   - Zapytanie przekroczyło określony timeout
   - **Rzuca**: `TimeoutError`

8. **Błąd Parsowania JSON**
   - Model zwrócił nieprawidłowy JSON
   - JSON nie zgodny ze schematem
   - **Rzuca**: `JSONParsingError`

## 6. Kwestie Bezpieczeństwa

### 6.1. Ochrona Klucza API

- Klucz API powinien być przechowywany w zmiennych środowiskowych
- Nigdy nie logować klucza API ani pełnych nagłówków zapytań
- W logach zastąpić klucz API placeholderem (np. `"apiKey": "***"`)

### 6.2. Walidacja Danych Wejściowych

- Walidacja wszystkich parametrów przed wysłaniem zapytania
- Sanityzacja zawartości wiadomości (usunięcie potencjalnie szkodliwych znaków)
- Weryfikacja poprawności JSON Schema przed wysłaniem

### 6.3. Timeout i Resource Limits

- Zawsze ustawiać timeout dla zapytań (domyślnie: 30s)
- Implementować maksymalną liczbę tokenów dla odpowiedzi
- Rozważyć implementację retry logic z exponential backoff dla błędów przejściowych

### 6.4. Error Information Disclosure

- Nie ujawniać wrażliwych informacji w komunikatach błędów
- Logować pełne detale błędów wewnętrznie, ale zwracać użytkownikowi uproszczone komunikaty
- Nie przekazywać surowych błędów API bezpośrednio do klienta

### 6.5. Audit i Monitoring

- Logować wszystkie zapytania (bez klucza API i wrażliwych danych)
- Śledzić wykorzystanie tokenów i koszty
- Monitorować częstotliwość błędów dla wczesnego wykrywania problemów

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Utworzenie Struktury Plików

1. Utwórz katalog `src/lib/services/openrouter/`
2. Utwórz następujące pliki:
   - `openrouter.service.ts` - główna klasa usługi
   - `openrouter.types.ts` - typy TypeScript
   - `openrouter.errors.ts` - klasy błędów
   - `index.ts` - eksport publicznego API

**Struktura:**
```
src/lib/services/openrouter/
├── openrouter.service.ts
├── openrouter.types.ts
├── openrouter.errors.ts
└── index.ts
```

### Krok 2: Implementacja Typów (`openrouter.types.ts`)

Zaimplementuj wszystkie interfejsy i typy opisane w sekcji 3:

```typescript
// 1. OpenRouterConfig
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  httpReferer?: string;
  appTitle?: string;
  defaultTimeout?: number;
  defaultModel?: string;
}

// 2. Message
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 3. JSONSchema (uproszczona wersja)
export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

// 4. ResponseFormat
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

// 5. CompletionRequest
export interface CompletionRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: ResponseFormat;
  timeout?: number;
}

// 6. CompletionResponse
export interface CompletionResponse<T = string> {
  content: T;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  raw: unknown;
}

// 7. SchemaCompletionRequest (dla completeWithSchema)
export interface SchemaCompletionRequest extends Omit<CompletionRequest, 'responseFormat'> {
  schema: JSONSchema;
  schemaName: string;
}
```

### Krok 3: Implementacja Błędów (`openrouter.errors.ts`)

Zaimplementuj hierarchię błędów opisaną w sekcji 5.1:

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

export class ConfigurationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

// ... implementuj pozostałe klasy błędów
```

**Uwaga**: Użyj `Object.setPrototypeOf` dla poprawnej hierarchii błędów w TypeScript.

### Krok 4: Implementacja Konstruktora i Konfiguracji

W `openrouter.service.ts`:

```typescript
import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  SchemaCompletionRequest,
  ResponseFormat,
  JSONSchema,
} from './openrouter.types';
import {
  ConfigurationError,
  ValidationError,
  // ... inne błędy
} from './openrouter.errors';

export class OpenRouterService {
  private readonly config: OpenRouterConfig;
  private readonly baseHeaders: Record<string, string>;
  private readonly baseUrl: string;

  constructor(config: OpenRouterConfig) {
    // Walidacja konfiguracji
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new ConfigurationError('API key is required');
    }

    // Ustawienie wartości domyślnych
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      httpReferer: config.httpReferer || 'https://10xcards.app',
      appTitle: config.appTitle || '10xCards',
      defaultTimeout: config.defaultTimeout || 30000,
      defaultModel: config.defaultModel || 'openai/gpt-4o-mini',
    };

    this.baseUrl = this.config.baseUrl;

    // Przygotowanie bazowych nagłówków
    this.baseHeaders = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.config.httpReferer!,
      'X-Title': this.config.appTitle!,
    };
  }

  // Publiczny dostęp do konfiguracji (read-only)
  public getConfig(): Readonly<OpenRouterConfig> {
    return Object.freeze({ ...this.config });
  }
}
```

### Krok 5: Implementacja Metody `buildRequestBody`

```typescript
private buildRequestBody(request: CompletionRequest): unknown {
  // Walidacja wiadomości
  if (!request.messages || request.messages.length === 0) {
    throw new ValidationError('Messages array cannot be empty');
  }

  // Walidacja parametrów
  if (request.temperature !== undefined) {
    if (request.temperature < 0 || request.temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }
  }

  if (request.topP !== undefined) {
    if (request.topP < 0 || request.topP > 1) {
      throw new ValidationError('topP must be between 0 and 1');
    }
  }

  // Budowanie ciała zapytania
  const body: Record<string, unknown> = {
    model: request.model || this.config.defaultModel,
    messages: request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  };

  // Dodanie opcjonalnych parametrów
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
```

### Krok 6: Implementacja Metody `executeRequest`

```typescript
private async executeRequest(
  body: unknown,
  timeout: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Obsługa błędów HTTP
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

    // Zwróć sparsowany JSON
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Obsługa abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(
        `Request timed out after ${timeout}ms`,
        { timeout }
      );
    }

    // Obsługa błędów sieciowych
    if (error instanceof TypeError) {
      throw new APIError(
        `Network error: ${error.message}`,
        0,
        { originalError: error }
      );
    }

    // Re-throw błędów OpenRouter
    if (error instanceof OpenRouterError) {
      throw error;
    }

    // Nieznany błąd
    throw new APIError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      0,
      { originalError: error }
    );
  }
}
```

### Krok 7: Implementacja Metody `handleAPIError`

```typescript
private handleAPIError(response: Response, errorBody: unknown): never {
  const status = response.status;
  const errorMessage = this.extractErrorMessage(errorBody);

  switch (status) {
    case 400:
      throw new ValidationError(
        `Validation error: ${errorMessage}`,
        errorBody
      );
    case 401:
      throw new AuthenticationError(
        `Authentication failed: ${errorMessage}`,
        errorBody
      );
    case 403:
      throw new AuthorizationError(
        `Authorization failed: ${errorMessage}`,
        errorBody
      );
    case 429: {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        `Rate limit exceeded: ${errorMessage}`,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        errorBody
      );
    }
    default:
      throw new APIError(
        `API error (${status}): ${errorMessage}`,
        status,
        errorBody
      );
  }
}

private extractErrorMessage(errorBody: unknown): string {
  if (typeof errorBody === 'object' && errorBody !== null) {
    const err = errorBody as Record<string, unknown>;
    if (typeof err.error === 'string') {
      return err.error;
    }
    if (typeof err.message === 'string') {
      return err.message;
    }
    if (typeof err.error === 'object' && err.error !== null) {
      const nestedErr = err.error as Record<string, unknown>;
      if (typeof nestedErr.message === 'string') {
        return nestedErr.message;
      }
    }
  }
  return 'Unknown error';
}
```

### Krok 8: Implementacja Metody `parseResponse`

```typescript
private parseResponse<T>(
  rawResponse: unknown,
  responseFormat?: ResponseFormat
): CompletionResponse<T> {
  // Walidacja struktury odpowiedzi
  if (typeof rawResponse !== 'object' || rawResponse === null) {
    throw new ValidationError('Invalid response structure from API');
  }

  const response = rawResponse as Record<string, unknown>;

  // Walidacja choices
  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new ValidationError('No choices in API response');
  }

  const choice = response.choices[0] as Record<string, unknown>;
  const message = choice.message as Record<string, unknown> | undefined;

  if (!message || typeof message.content !== 'string') {
    throw new ValidationError('Invalid message structure in API response');
  }

  const content = message.content;

  // Parsowanie content
  let parsedContent: T;
  if (responseFormat) {
    parsedContent = this.validateJSONResponse<T>(
      content,
      responseFormat.json_schema.schema
    );
  } else {
    parsedContent = content as T;
  }

  // Ekstraktuj usage
  const usage = response.usage as Record<string, unknown> | undefined;
  const usageData = {
    promptTokens: (usage?.prompt_tokens as number) || 0,
    completionTokens: (usage?.completion_tokens as number) || 0,
    totalTokens: (usage?.total_tokens as number) || 0,
  };

  // Ekstraktuj finish_reason
  const finishReason = (choice.finish_reason as string) || 'stop';

  return {
    content: parsedContent,
    model: (response.model as string) || 'unknown',
    usage: usageData,
    finishReason: finishReason as CompletionResponse['finishReason'],
    raw: rawResponse,
  };
}
```

### Krok 9: Implementacja Metody `validateJSONResponse`

```typescript
private validateJSONResponse<T>(
  content: string,
  schema?: JSONSchema
): T {
  // Próba ekstrakcji JSON z markdown code blocks
  let jsonString = content.trim();

  // Usuń markdown code block jeśli istnieje
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  }

  // Próba ekstrakcji tablicy lub obiektu
  const jsonMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  // Parsuj JSON
  let parsed: T;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new JSONParsingError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { content, error }
    );
  }

  // Opcjonalna walidacja schematu (podstawowa)
  if (schema) {
    this.validateAgainstSchema(parsed, schema);
  }

  return parsed;
}

private validateAgainstSchema(data: unknown, schema: JSONSchema): void {
  // Podstawowa walidacja typu
  const actualType = Array.isArray(data) ? 'array' : typeof data;

  if (schema.type === 'object' && actualType !== 'object') {
    throw new JSONParsingError(
      `Schema validation failed: expected object, got ${actualType}`
    );
  }

  if (schema.type === 'array' && !Array.isArray(data)) {
    throw new JSONParsingError(
      `Schema validation failed: expected array, got ${actualType}`
    );
  }

  // Walidacja wymaganych pól dla obiektów
  if (schema.type === 'object' && schema.required && typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const required of schema.required) {
      if (!(required in obj)) {
        throw new JSONParsingError(
          `Schema validation failed: missing required field "${required}"`
        );
      }
    }
  }

  // Dla produkcyjnego użycia rozważ użycie biblioteki do walidacji JSON Schema
  // np. ajv, zod, lub yup
}
```

### Krok 10: Implementacja Metody `complete`

```typescript
public async complete<T = string>(
  request: CompletionRequest
): Promise<CompletionResponse<T>> {
  // 1. Zbuduj ciało zapytania
  const body = this.buildRequestBody(request);

  // 2. Określ timeout
  const timeout = request.timeout || this.config.defaultTimeout!;

  // 3. Wykonaj zapytanie
  const rawResponse = await this.executeRequest(body, timeout);

  // 4. Parsuj odpowiedź
  const response = this.parseResponse<T>(rawResponse, request.responseFormat);

  return response;
}
```

### Krok 11: Implementacja Metody `completeWithSchema`

```typescript
public async completeWithSchema<T>(
  request: SchemaCompletionRequest
): Promise<CompletionResponse<T>> {
  // Walidacja nazwy schematu
  if (!request.schemaName || !/^[a-zA-Z0-9_]+$/.test(request.schemaName)) {
    throw new ValidationError(
      'Schema name must contain only letters, numbers, and underscores'
    );
  }

  // Tworzenie responseFormat
  const responseFormat: ResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: request.schemaName,
      strict: true,
      schema: request.schema,
    },
  };

  // Wywołanie complete z responseFormat
  return this.complete<T>({
    ...request,
    responseFormat,
  });
}
```

### Krok 12: Eksport Publicznego API (`index.ts`)

```typescript
export { OpenRouterService } from './openrouter.service';
export type {
  OpenRouterConfig,
  Message,
  JSONSchema,
  ResponseFormat,
  CompletionRequest,
  CompletionResponse,
  SchemaCompletionRequest,
} from './openrouter.types';
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
```

### Krok 13: Refaktoryzacja `generation.service.ts`

Zmień funkcję `callOpenRouterAPI` aby używała nowej usługi:

```typescript
import { OpenRouterService } from './openrouter/index';
import type { FlashcardSuggestion } from '../../types';

// Utwórz singleton (lub wstrzykuj przez dependency injection)
let openRouterService: OpenRouterService | null = null;

function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    openRouterService = new OpenRouterService({
      apiKey,
      httpReferer: import.meta.env.SITE || 'https://10xcards.app',
      appTitle: '10xCards',
    });
  }
  return openRouterService;
}

async function callOpenRouterAPI(
  model: string,
  sourceText: string
): Promise<FlashcardSuggestion[]> {
  const service = getOpenRouterService();

  const systemPrompt = `You are a flashcard generator. Generate high-quality flashcards from the provided text.
Rules:
- Generate 3-8 flashcards depending on content length and complexity
- Front: A clear question or prompt (max 200 chars)
- Back: A concise answer (max 500 chars)
- Focus on key concepts, definitions, and important facts
- Ensure flashcards are independent and self-contained`;

  // Definicja schematu dla odpowiedzi
  const flashcardSchema = {
    type: 'object' as const,
    properties: {
      flashcards: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            front: { type: 'string' as const, maxLength: 200 },
            back: { type: 'string' as const, maxLength: 500 },
          },
          required: ['front', 'back'],
          additionalProperties: false,
        },
        minItems: 3,
        maxItems: 8,
      },
    },
    required: ['flashcards'],
    additionalProperties: false,
  };

  try {
    const response = await service.completeWithSchema<{ flashcards: FlashcardSuggestion[] }>({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Generate flashcards from this text:\n\n${sourceText}`,
        },
      ],
      model,
      schema: flashcardSchema,
      schemaName: 'flashcard_generation_response',
      temperature: 0.7,
      maxTokens: 2000,
    });

    return response.content.flashcards;
  } catch (error) {
    // Mapuj błędy OpenRouter na błędy generacji
    if (error instanceof OpenRouterError) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw error;
  }
}
```

### Krok 14: Testowanie

Utwórz plik testowy `openrouter.service.test.ts` (opcjonalnie):

```typescript
import { OpenRouterService } from './openrouter.service';
import { ConfigurationError } from './openrouter.errors';

// Test 1: Walidacja konfiguracji
try {
  new OpenRouterService({ apiKey: '' });
  console.error('❌ Should throw ConfigurationError for empty API key');
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.log('✅ Correctly throws ConfigurationError for empty API key');
  }
}

// Test 2: Poprawne utworzenie instancji
const service = new OpenRouterService({
  apiKey: 'sk-test-123',
});
console.log('✅ Service instance created successfully');

// Test 3: Podstawowe zapytanie (wymaga prawdziwego klucza API)
// const result = await service.complete({
//   messages: [{ role: 'user', content: 'Hello!' }],
//   maxTokens: 50,
// });
// console.log('✅ Basic completion works:', result.content);
```

### Krok 15: Dokumentacja i Przykłady

Dodaj dokumentację w `README.md` lub komentarzach JSDoc:

```typescript
/**
 * OpenRouter Service
 *
 * Usługa do komunikacji z OpenRouter API dla zapytań LLM.
 *
 * @example Podstawowe użycie
 * ```typescript
 * const service = new OpenRouterService({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 * });
 *
 * const response = await service.complete({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'What is TypeScript?' },
 *   ],
 *   temperature: 0.7,
 * });
 *
 * console.log(response.content);
 * ```
 *
 * @example Strukturalna odpowiedź JSON
 * ```typescript
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     title: { type: 'string' },
 *     summary: { type: 'string' },
 *     tags: { type: 'array', items: { type: 'string' } },
 *   },
 *   required: ['title', 'summary'],
 * };
 *
 * const response = await service.completeWithSchema<{
 *   title: string;
 *   summary: string;
 *   tags?: string[];
 * }>({
 *   messages: [
 *     { role: 'user', content: 'Summarize: [article text]' },
 *   ],
 *   schema,
 *   schemaName: 'article_summary',
 * });
 *
 * console.log(response.content.title);
 * ```
 */
```

### Krok 16: Integracja z Istniejącym Kodem

1. Zaktualizuj importy w `generation.service.ts`
2. Usuń starą funkcję `callOpenRouterAPI` (lub zostaw jako deprecated)
3. Przetestuj wszystkie endpointy API wykorzystujące generację fiszek
4. Zweryfikuj, że obsługa błędów działa poprawnie

### Krok 17: Aktualizacja Typu Błędów w `types.ts`

Dodaj nowe kody błędów do `ErrorResponse`:

```typescript
export interface ErrorResponse {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "UNAUTHORIZED"
      | "RATE_LIMIT_ERROR"
      | "AI_SERVICE_ERROR"  // Zmapowane z OpenRouterError
      | "INTERNAL_ERROR"
      | "TIMEOUT_ERROR"     // Nowy
      | "CONFIGURATION_ERROR"; // Nowy
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Krok 18: Logging i Monitoring (Opcjonalne)

Dodaj logging do usługi:

```typescript
private log(level: 'info' | 'error', message: string, meta?: unknown): void {
  // Sanityzuj metadane (usuń API key)
  const sanitized = meta ? this.sanitizeLogData(meta) : undefined;

  // W produkcji użyj dedykowanej biblioteki do logowania
  console[level](`[OpenRouterService] ${message}`, sanitized);
}

private sanitizeLogData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data as Record<string, unknown> };
    if ('apiKey' in sanitized) {
      sanitized.apiKey = '***';
    }
    if ('Authorization' in sanitized) {
      sanitized.Authorization = 'Bearer ***';
    }
    return sanitized;
  }
  return data;
}
```

## Podsumowanie

Ten plan implementacji dostarcza kompleksowy przewodnik po stworzeniu profesjonalnej usługi OpenRouter zgodnej z najlepszymi praktykami TypeScript i architekturą projektu 10xCards. Usługa będzie:

- **Typowa i bezpieczna** dzięki pełnemu wykorzystaniu TypeScript
- **Reużywalna** w różnych kontekstach aplikacji
- **Odporna na błędy** dzięki kompleksowej obsłudze i typowaniu błędów
- **Łatwa w testowaniu** dzięki enkapsulacji i dependency injection
- **Zgodna z OpenRouter API** włącznie ze wsparciem dla JSON Schema
- **Bezpieczna** dzięki walidacji, timeoutom i ochronie wrażliwych danych

Refaktoryzacja istniejącego kodu `generation.service.ts` będzie prosta i nie będzie wymagała zmian w API endpointach, zapewniając płynną migrację.
