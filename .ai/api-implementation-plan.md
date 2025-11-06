# REST API Implementation Plan for 10xCards

## Overview

This document provides a comprehensive implementation plan for all REST API endpoints in the 10xCards application. The API enables flashcard management and AI-powered flashcard generation with validation and rate limiting.

**⚠️ IMPORTANT - Development Phase**:
For initial development and manual testing, authentication and authorization are **disabled**. All endpoints will work without user authentication, and `user_id` will be handled using a hardcoded test value. RLS policies will be added later once manual testing is complete.

---

## 1. Flashcard Endpoints

### 1.1 List Flashcards - GET /api/flashcards

#### Request Details
- **HTTP Method**: GET
- **URL Pattern**: `/api/flashcards`
- **Authentication**: None (disabled for manual testing)
- **Query Parameters**:
  - `page` (number, optional, default: 1, min: 1)
  - `limit` (number, optional, default: 20, min: 1, max: 100)
  - `source` (string, optional, enum: 'ai-full' | 'ai-edited' | 'manual')
  - `generation_id` (number, optional)

#### Types Used
- **Response**: `PaginatedFlashcardsResponse`
- **DTO**: `FlashcardDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**:
```json
{
  "data": [FlashcardDTO[]],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```
- **Error Responses**: 400 (invalid params)

#### Data Flow
1. Extract query parameters from request URL
2. Validate parameters using Zod schema
3. Use hardcoded test `user_id` (e.g., "00000000-0000-0000-0000-000000000000")
4. Build Supabase query with filters:
   - Filter by hardcoded `user_id`
   - Apply optional `source` filter
   - Apply optional `generation_id` filter
   - Calculate offset: `(page - 1) * limit`
   - Apply limit
5. Execute count query for pagination metadata
6. Execute data query with filters and pagination
7. Transform database rows to `FlashcardDTO[]` (omit `user_id`)
8. Calculate `total_pages = Math.ceil(total / limit)`
9. Return paginated response

#### Security Considerations (for later implementation)
- ⚠️ Currently using hardcoded `user_id` for testing
- RLS policies will be enabled after manual testing
- Validate enum values for `source` parameter
- Sanitize `generation_id` to prevent SQL injection
- Never expose `user_id` in response DTOs

#### Error Handling
- **400 Bad Request**: Invalid query parameters (negative page, limit > 100, invalid source enum)
- **500 Internal Error**: Database connection failures

#### Performance Considerations
- Use database indexes on `user_id`, `generation_id`, `source`
- Limit max page size to 100 to prevent excessive data transfer
- Consider client-side caching with cache invalidation on mutations

#### Implementation Steps
1. Create `/src/pages/api/flashcards.ts` with `export const prerender = false`
2. Create GET handler function
3. Define Zod schema for query parameter validation
4. Extract and validate query parameters
5. Use hardcoded test `user_id = "00000000-0000-0000-0000-000000000000"`
6. Create flashcard service function `listFlashcards(supabase, userId, filters, pagination)`
7. Build Supabase query without RLS (direct filtering by user_id)
8. Execute count and data queries
9. Map results to `PaginatedFlashcardsResponse`
10. Return JSON response with proper status codes
11. Implement error handling with `try-catch` and return `ErrorResponse`

---

### 1.2 Get Single Flashcard - GET /api/flashcards/:id

#### Request Details
- **HTTP Method**: GET
- **URL Pattern**: `/api/flashcards/[id]`
- **Authentication**: None (disabled for manual testing)
- **URL Parameters**:
  - `id` (number, required)

#### Types Used
- **Response**: `FlashcardDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**: Single `FlashcardDTO` object
- **Error Responses**: 400 (invalid ID), 404 (not found)

#### Data Flow
1. Extract `id` from URL parameters (`context.params.id`)
2. Parse and validate `id` as positive integer
3. Use hardcoded test `user_id`
4. Query flashcard by `id` AND hardcoded `user_id`
5. If not found, return 404
6. Transform to `FlashcardDTO` (omit `user_id`)
7. Return response

#### Security Considerations (for later implementation)
- ⚠️ Currently using hardcoded `user_id` for testing
- RLS will ensure users can only access their own flashcards
- Validate `id` is a positive integer to prevent injection

#### Error Handling
- **400 Bad Request**: Invalid ID format (non-numeric, negative)
- **404 Not Found**: Flashcard doesn't exist
- **500 Internal Error**: Database errors

#### Performance Considerations
- Single row query with primary key lookup (very fast)
- Use RLS index on `user_id`

#### Implementation Steps
1. Create `/src/pages/api/flashcards/[id].ts`
2. Create GET handler
3. Extract and validate `id` parameter
4. Create service function `getFlashcardById(userId, flashcardId)`
5. Query Supabase with `.select().eq('id', id).single()`
6. Handle not found case (return 404)
7. Map to `FlashcardDTO`
8. Return JSON response

---

### 1.3 Create Manual Flashcard - POST /api/flashcards

#### Request Details
- **HTTP Method**: POST
- **URL Pattern**: `/api/flashcards`
- **Authentication**: None (disabled for manual testing)
- **Request Body**:
```json
{
  "front": "string (1-200 chars)",
  "back": "string (1-500 chars)"
}
```

#### Types Used
- **Request**: `CreateFlashcardCommand`
- **Response**: `FlashcardDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (201)**: Created `FlashcardDTO`
- **Error Responses**: 400 (validation), 422 (invalid format)

#### Data Flow
1. Parse request body as JSON
2. Validate using Zod schema (CreateFlashcardCommand)
3. Use hardcoded test `user_id`
4. Insert into `flashcards` table:
   - `front`, `back` from request
   - `source = 'manual'`
   - `user_id` = hardcoded test value
   - `generation_id = null`
   - `created_at`, `updated_at` auto-generated
5. Return created flashcard as `FlashcardDTO`

#### Security Considerations (for later implementation)
- ⚠️ Currently using hardcoded `user_id` for testing
- Sanitize front/back content to prevent XSS
- Validate string lengths server-side (don't trust client)

#### Error Handling
- **400 Bad Request**: Validation failures (empty strings, length exceeded)
- **422 Unprocessable Entity**: Invalid JSON format
- **500 Internal Error**: Database insert failures

#### Performance Considerations
- Single insert operation (fast)
- Use database default values for timestamps

#### Implementation Steps
1. Add POST handler to `/src/pages/api/flashcards.ts`
2. Define Zod schema for `CreateFlashcardCommand`
3. Parse and validate request body
4. Create service function `createManualFlashcard(userId, command)`
5. Insert into Supabase with `.insert().select().single()`
6. Map result to `FlashcardDTO`
7. Return 201 status with created resource
8. Implement validation error handling

---

### 1.4 Bulk Create Flashcards - POST /api/flashcards/bulk

#### Request Details
- **HTTP Method**: POST
- **URL Pattern**: `/api/flashcards/bulk`
- **Authentication**: None (disabled for manual testing)
- **Request Body**:
```json
{
  "generation_id": number,
  "flashcards": [
    {
      "front": "string (1-200)",
      "back": "string (1-500)",
      "source": "ai-full" | "ai-edited"
    }
  ]
}
```

#### Types Used
- **Request**: `BulkCreateFlashcardsCommand`
- **Response**: `BulkCreateFlashcardsResponse`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (201)**:
```json
{
  "created_count": 2,
  "flashcards": [FlashcardDTO[]]
}
```
- **Error Responses**: 400 (validation), 404 (generation not found), 422 (invalid format)

#### Data Flow
1. Parse and validate request body
2. Validate array length (1-50 items)
3. Use hardcoded test `user_id`
4. Verify `generation_id` exists (for hardcoded user_id)
5. Begin database transaction
6. Insert all flashcards with `generation_id` and hardcoded `user_id`
7. Count `ai-full` vs `ai-edited` flashcards
8. Update generation record:
   - `accepted_unedited_count += count_ai_full`
   - `accepted_edited_count += count_ai_edited`
9. Commit transaction
10. Return created flashcards with count

#### Security Considerations (for later implementation)
- ⚠️ Currently using hardcoded `user_id` for testing
- Validate source is only 'ai-full' or 'ai-edited' (not 'manual')
- Use transaction to ensure atomicity
- Sanitize all flashcard content

#### Error Handling
- **400 Bad Request**: Validation errors (invalid source, empty array, > 50 items)
- **404 Not Found**: Generation ID doesn't exist
- **422 Unprocessable Entity**: Invalid JSON structure
- **500 Internal Error**: Transaction rollback on database errors

#### Performance Considerations
- Use bulk insert for all flashcards (single query)
- Use database transaction for consistency
- Update generation counts in same transaction
- Limit to 50 flashcards per request to prevent excessive load

#### Implementation Steps
1. Create `/src/pages/api/flashcards/bulk.ts`
2. Create POST handler
3. Define Zod schema for `BulkCreateFlashcardsCommand`
4. Validate request body including array constraints
5. Create service function `bulkCreateFlashcards(userId, command)`
6. Verify generation ownership
7. Use Supabase transaction or RPC for atomic operations
8. Bulk insert flashcards
9. Calculate and update generation acceptance counts
10. Return `BulkCreateFlashcardsResponse`

---

### 1.5 Update Flashcard - PATCH /api/flashcards/:id

#### Request Details
- **HTTP Method**: PATCH
- **URL Pattern**: `/api/flashcards/[id]`
- **Authentication**: None (disabled for manual testing)
- **URL Parameters**: `id` (number)
- **Request Body** (at least one required):
```json
{
  "front": "string (1-200)",
  "back": "string (1-500)"
}
```

#### Types Used
- **Request**: `UpdateFlashcardCommand`
- **Response**: `FlashcardDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**: Updated `FlashcardDTO`
- **Error Responses**: 400 (validation, no fields), 404 (not found), 422 (invalid format)

#### Data Flow
1. Extract `id` from URL
2. Parse and validate request body
3. Validate at least one field is provided
4. Get authenticated user
5. Fetch current flashcard to check `source`
6. Determine new source:
   - If current `source = 'ai-full'` → change to `'ai-edited'`
   - Otherwise keep current source
7. Update flashcard with new values
8. Trigger automatically updates `updated_at`
9. Return updated flashcard

#### Security Considerations
- RLS ensures user can only update their own flashcards
- Validate partial update (at least one field required)
- Sanitize content to prevent XSS
- Return 404 for unauthorized access (don't reveal existence)

#### Error Handling
- **400 Bad Request**: No fields provided, validation failures
- **404 Not Found**: Flashcard doesn't exist or unauthorized
- **422 Unprocessable Entity**: Invalid JSON
- **500 Internal Error**: Database update failures

#### Performance Considerations
- Single row update with primary key
- Database trigger handles `updated_at` automatically

#### Implementation Steps
1. Add PATCH handler to `/src/pages/api/flashcards/[id].ts`
2. Define Zod schema for `UpdateFlashcardCommand` with partial validation
3. Extract and validate `id` and request body
4. Validate at least one field is present
5. Create service function `updateFlashcard(userId, flashcardId, command)`
6. Fetch current flashcard to determine source change
7. Build update object with source logic
8. Execute update query
9. Return updated `FlashcardDTO`

---

### 1.6 Delete Flashcard - DELETE /api/flashcards/:id

#### Request Details
- **HTTP Method**: DELETE
- **URL Pattern**: `/api/flashcards/[id]`
- **Authentication**: None (disabled for manual testing)
- **URL Parameters**: `id` (number)

#### Types Used
- **Error**: `ErrorResponse`

#### Response Details
- **Success (204)**: Empty response body
- **Error Responses**: 400 (invalid ID), 404 (not found)

#### Data Flow
1. Extract and validate `id` from URL
2. Get authenticated user
3. Delete flashcard where `id` AND `user_id = auth.uid()`
4. RLS enforces ownership
5. Return 204 No Content

#### Security Considerations
- RLS prevents deleting other users' flashcards
- Return 404 for both non-existent and unauthorized (no info leakage)
- Cascade behavior: `generation_id` has `ON DELETE SET NULL`

#### Error Handling
- **400 Bad Request**: Invalid ID format
- **404 Not Found**: Flashcard doesn't exist or unauthorized
- **500 Internal Error**: Database errors

#### Performance Considerations
- Single row deletion with primary key (fast)

#### Implementation Steps
1. Add DELETE handler to `/src/pages/api/flashcards/[id].ts`
2. Extract and validate `id`
3. Create service function `deleteFlashcard(userId, flashcardId)`
4. Execute delete query
5. Return 204 status with no body

---

## 2. AI Generation Endpoints

### 2.1 Generate Flashcard Suggestions - POST /api/generations

#### Request Details
- **HTTP Method**: POST
- **URL Pattern**: `/api/generations`
- **Authentication**: None (disabled for manual testing)
- **Rate Limit**: Disabled for manual testing
- **Request Body**:
```json
{
  "source_text": "string (1000-10000 chars)",
  "model": "string (optional)"
}
```

#### Types Used
- **Request**: `GenerateFlashcardsCommand`
- **Response**: `GenerationResultDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**:
```json
{
  "generation_id": 46,
  "model": "openai/gpt-4",
  "generated_count": 5,
  "generation_duration": 3500,
  "suggestions": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "created_at": "2025-01-15T11:15:00Z"
}
```
- **Error Responses**: 400 (text length), 422 (invalid format), 429 (rate limit), 500 (AI failure), 503 (service unavailable)

#### Data Flow
1. Check rate limit (handled by middleware)
2. Parse and validate request body
3. Validate `source_text` length (1000-10000)
4. Set `model` to default if not provided
5. Get authenticated user
6. Hash `source_text` using SHA-256
7. Start timer for duration tracking
8. Create generation record with initial data:
   - `user_id`, `model`, `source_text_hash`, `source_text_length`
   - `generated_count = 0` (updated later)
   - `accepted_unedited_count = null`
   - `accepted_edited_count = null`
9. Call OpenRouter API with source text
10. Parse AI response to extract flashcard suggestions
11. Stop timer and calculate `generation_duration`
12. Update generation record with `generated_count` and `generation_duration`
13. Return suggestions without saving as flashcards
14. On error: Log to `generation_error_logs` and return appropriate error

#### Security Considerations
- Rate limit enforced by middleware (10/hour per IP)
- Validate text length to prevent excessive API costs
- Store API key in environment variables (never expose)
- Hash source text for deduplication (don't store full text)
- Sanitize AI response before returning

#### Error Handling
- **400 Bad Request**: Text length outside 1000-10000 range
- **422 Unprocessable Entity**: Invalid JSON format
- **429 Too Many Requests**: Rate limit exceeded (10/hour)
- **500 Internal Server Error**: AI API failures, database errors (log to `generation_error_logs`)
- **503 Service Unavailable**: OpenRouter service down

**Error Logging** (for AI failures):
Insert into `generation_error_logs`:
- `user_id`, `model`, `source_text_hash`, `source_text_length`
- `error_code`, `error_message`
- `created_at`

#### Performance Considerations
- AI API call is the primary bottleneck (3-10 seconds typical)
- Use streaming if OpenRouter supports it for better UX
- Consider implementing request queuing for high load
- Cache generation results by `source_text_hash` (optional)

#### Implementation Steps
1. Create `/src/pages/api/generations.ts`
2. Create POST handler
3. Define Zod schema for `GenerateFlashcardsCommand`
4. Validate request body
5. Create `generation.service.ts` with OpenRouter integration
6. Implement SHA-256 hashing utility
7. Create generation record
8. Call OpenRouter API with error handling
9. Parse and validate AI response
10. Update generation record with results
11. Map to `GenerationResultDTO`
12. Implement error logging to `generation_error_logs`
13. Return response with proper status codes

---

### 2.2 List Generations - GET /api/generations

#### Request Details
- **HTTP Method**: GET
- **URL Pattern**: `/api/generations`
- **Authentication**: None (disabled for manual testing)
- **Query Parameters**:
  - `page` (number, optional, default: 1, min: 1)
  - `limit` (number, optional, default: 20, min: 1, max: 100)

#### Types Used
- **Response**: `PaginatedGenerationsResponse`
- **DTO**: `GenerationDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**:
```json
{
  "data": [GenerationDTO[]],
  "pagination": PaginationMeta
}
```
- **Error Responses**: 400 (invalid params), 401 (unauthorized)

#### Data Flow
1. Extract and validate query parameters
2. Get authenticated user
3. Query generations filtered by `user_id`
4. Order by `created_at DESC` (most recent first)
5. Apply pagination
6. Execute count query
7. Transform to `GenerationDTO[]` (omit `user_id`, `source_text_hash`, `updated_at`)
8. Return paginated response

#### Security Considerations
- RLS enforces `user_id` filter
- Omit sensitive fields (`source_text_hash`, `updated_at`) from response
- Validate pagination parameters

#### Error Handling
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Not authenticated
- **500 Internal Error**: Database errors

#### Performance Considerations
- Use index on `user_id` and `created_at` for sorting
- Limit max page size to 100

#### Implementation Steps
1. Add GET handler to `/src/pages/api/generations.ts`
2. Define query parameter validation schema
3. Create service function `listGenerations(userId, pagination)`
4. Build query with RLS, ordering, and pagination
5. Execute count and data queries
6. Map to `PaginatedGenerationsResponse`
7. Return JSON response

---

### 2.3 Get Generation Statistics - GET /api/generations/statistics

#### Request Details
- **HTTP Method**: GET
- **URL Pattern**: `/api/generations/statistics`
- **Authentication**: None (disabled for manual testing)
- **Query Parameters**:
  - `period` (string, optional, enum: 'week' | 'month' | 'all', default: 'all')

#### Types Used
- **Response**: `GenerationStatisticsDTO`
- **Error**: `ErrorResponse`

#### Response Details
- **Success (200)**:
```json
{
  "total_generations": 10,
  "total_generated_flashcards": 47,
  "total_accepted_flashcards": 35,
  "total_accepted_unedited": 28,
  "total_accepted_edited": 7,
  "acceptance_rate": 0.745,
  "unedited_acceptance_rate": 0.596,
  "average_generation_duration": 3200,
  "most_used_model": "openai/gpt-4",
  "period": "all"
}
```
- **Error Responses**: 400 (invalid period), 401 (unauthorized)

#### Data Flow
1. Extract and validate `period` parameter
2. Get authenticated user
3. Calculate date filter based on period:
   - 'week': `created_at >= NOW() - INTERVAL '7 days'`
   - 'month': `created_at >= NOW() - INTERVAL '30 days'`
   - 'all': no date filter
4. Execute aggregation query:
   - `COUNT(*)` as total_generations
   - `SUM(generated_count)` as total_generated_flashcards
   - `SUM(accepted_unedited_count + accepted_edited_count)` as total_accepted_flashcards
   - `SUM(accepted_unedited_count)` as total_accepted_unedited
   - `SUM(accepted_edited_count)` as total_accepted_edited
   - `AVG(generation_duration)` as average_generation_duration
   - `MODE() WITHIN GROUP (ORDER BY model)` as most_used_model
5. Calculate rates:
   - `acceptance_rate = total_accepted / total_generated`
   - `unedited_acceptance_rate = total_accepted_unedited / total_generated`
6. Return statistics

#### Security Considerations
- RLS filters statistics to current user only
- Validate period enum to prevent injection

#### Error Handling
- **400 Bad Request**: Invalid period parameter
- **401 Unauthorized**: Not authenticated
- **500 Internal Error**: Aggregation query failures

#### Performance Considerations
- Aggregation queries can be expensive with many records
- Consider caching results per user/period
- Use indexes on `user_id` and `created_at`

#### Implementation Steps
1. Create `/src/pages/api/generations/statistics.ts`
2. Create GET handler
3. Validate `period` parameter with Zod enum
4. Create service function `getGenerationStatistics(userId, period)`
5. Build aggregation query with date filtering
6. Execute query and calculate rates
7. Map to `GenerationStatisticsDTO`
8. Return JSON response

---

## 3. Cross-Cutting Concerns

### 3.1 Hardcoded User ID for Testing

**Implementation Location**: All API endpoints

**Test User ID**: `"00000000-0000-0000-0000-000000000000"`

**Usage**:
```typescript
// In each endpoint handler
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient;
  // Use TEST_USER_ID for all database queries
  const result = await flashcardService.list(supabase, TEST_USER_ID, filters, pagination);
  // ...
}
```

**Note**: This test user ID should be used across all endpoints until authentication is implemented.

---

### 3.2 Rate Limiting Strategy (To Be Implemented Later)

**Status**: ⚠️ Disabled for manual testing phase

**Future Implementation**:
- Will be implemented in `src/middleware/index.ts` or `src/lib/services/rate-limit.service.ts`
- Algorithm: Sliding window with in-memory storage (or Redis for production)
- Planned limits:
  - `/api/generations`: 10 requests per hour per IP
  - Other endpoints: 100 requests per minute per IP

**Future Implementation Pattern**:
```typescript
interface RateLimitConfig {
  max: number;
  window: number; // seconds
}

const rateLimitStore = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string, path: string): {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
} {
  const config: RateLimitConfig = path.includes('/generations')
    ? { max: 10, window: 3600 }
    : { max: 100, window: 60 };

  const key = `${ip}:${path}`;
  const now = Math.floor(Date.now() / 1000);
  const stored = rateLimitStore.get(key);

  if (!stored || now > stored.reset) {
    rateLimitStore.set(key, {
      count: 1,
      reset: now + config.window
    });
    return {
      allowed: true,
      remaining: config.max - 1,
      reset: now + config.window,
      limit: config.max
    };
  }

  if (stored.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      reset: stored.reset,
      limit: config.max
    };
  }

  stored.count++;
  return {
    allowed: true,
    remaining: config.max - stored.count,
    reset: stored.reset,
    limit: config.max
  };
}
```

---

### 3.3 Validation Strategy

**Library**: Zod

**Location**: Define schemas alongside endpoint handlers

**Common Schemas**:

```typescript
// Pagination
const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// Flashcard content
const flashcardContentSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
});

// Flashcard source
const flashcardSourceSchema = z.enum(['ai-full', 'ai-edited', 'manual']);

// Create flashcard
const createFlashcardSchema = flashcardContentSchema;

// Update flashcard
const updateFlashcardSchema = flashcardContentSchema.partial().refine(
  (data) => data.front !== undefined || data.back !== undefined,
  { message: "At least one field must be provided" }
);

// Bulk create
const bulkCreateSchema = z.object({
  generation_id: z.number().int().positive(),
  flashcards: z.array(
    flashcardContentSchema.extend({
      source: z.enum(['ai-full', 'ai-edited']),
    })
  ).min(1).max(50),
});

// Generate flashcards
const generateFlashcardsSchema = z.object({
  source_text: z.string().min(1000).max(10000),
  model: z.string().optional(),
});

// Period filter
const periodSchema = z.enum(['week', 'month', 'all']).optional().default('all');
```

**Validation Pattern**:
```typescript
export async function POST(context: APIContext) {
  try {
    const body = await context.request.json();
    const validated = schema.parse(body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors
        }
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    throw error;
  }
}
```

---

### 3.4 Error Response Format

**Standard Structure**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional context
    }
  }
}
```

**Error Codes**:
- `VALIDATION_ERROR` (400): Input validation failures
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `NOT_FOUND` (404): Resource doesn't exist
- `RATE_LIMIT_ERROR` (429): Too many requests
- `AI_SERVICE_ERROR` (500/503): External AI API failures
- `INTERNAL_ERROR` (500): Unexpected server errors

**Helper Function**:
```typescript
function errorResponse(
  code: ErrorResponse['error']['code'],
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return new Response(JSON.stringify({
    error: { code, message, details }
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
```

---

### 3.5 Service Layer Architecture

**Location**: `src/lib/services/`

**Services to Create**:

1. **flashcard.service.ts**:
   - `listFlashcards(supabase, userId, filters, pagination)`
   - `getFlashcardById(supabase, userId, flashcardId)`
   - `createManualFlashcard(supabase, userId, command)`
   - `bulkCreateFlashcards(supabase, userId, command)`
   - `updateFlashcard(supabase, userId, flashcardId, command)`
   - `deleteFlashcard(supabase, userId, flashcardId)`

2. **generation.service.ts**:
   - `generateFlashcards(supabase, userId, command)`
   - `listGenerations(supabase, userId, pagination)`
   - `getGenerationStatistics(supabase, userId, period)`
   - `callOpenRouterAPI(model, sourceText)`
   - `parseAIResponse(response)`

3. **rate-limit.service.ts**:
   - `checkRateLimit(ip, path)`
   - `getRateLimitConfig(path)`

**Service Pattern**:
```typescript
// flashcard.service.ts
import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardDTO, PaginatedFlashcardsResponse } from "../types";

export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    source?: FlashcardSource;
    generation_id?: number;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<PaginatedFlashcardsResponse> {
  // Implementation
}
```

---

## 4. Database Considerations

### 4.1 RLS Policies

All tables (`flashcards`, `generations`, `generation_error_logs`) require RLS policies:

```sql
-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Flashcards policies
CREATE POLICY "Users can view their own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);

-- Similar policies for generations and generation_error_logs
```

### 4.2 Indexes

```sql
-- Flashcards
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
CREATE INDEX idx_flashcards_source ON flashcards(source);
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at DESC);

-- Generations
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Generation error logs
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);
```

### 4.3 Triggers

```sql
-- Auto-update updated_at on flashcards
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Similar trigger for generations if needed
```

---

## 5. Deployment Checklist (Development Phase)

### 5.1 Environment Variables
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `OPENROUTER_API_KEY`
- [ ] `DEFAULT_AI_MODEL` (optional)

### 5.2 Database Setup
- [ ] Run migrations to create tables
- [ ] Create indexes
- [ ] Create triggers
- [ ] ⚠️ RLS policies - SKIP for now (will be added after manual testing)

### 5.3 Manual Testing Preparation
- [ ] Create test user record with `user_id = "00000000-0000-0000-0000-000000000000"`
- [ ] Verify API keys are not exposed
- [ ] Test XSS prevention with malicious input
- [ ] Test with sample datasets
- [ ] Verify pagination works correctly
- [ ] Test AI generation with OpenRouter

---

## 6. Implementation Order (Development Phase)

1. **Phase 1: Foundation**
   - Create Supabase client setup in `src/db/supabase.client.ts`
   - Create service layer structure in `src/lib/services/`
   - Define all Zod schemas
   - Implement error response helpers
   - Set up middleware to attach Supabase client to `context.locals`

2. **Phase 2: Flashcard CRUD**
   - List flashcards (GET /api/flashcards)
   - Get single flashcard (GET /api/flashcards/:id)
   - Create manual flashcard (POST /api/flashcards)
   - Update flashcard (PATCH /api/flashcards/:id)
   - Delete flashcard (DELETE /api/flashcards/:id)

3. **Phase 3: AI Generation**
   - Generate flashcards (POST /api/generations)
   - Implement OpenRouter integration
   - Implement error logging
   - Bulk create flashcards (POST /api/flashcards/bulk)

4. **Phase 4: Analytics**
   - List generations (GET /api/generations)
   - Generation statistics (GET /api/generations/statistics)

5. **Phase 5: Manual Testing**
   - Test all endpoints using Postman/Thunder Client/similar
   - Verify database operations
   - Test error scenarios
   - Validate data flow

6. **Phase 6: Authentication & Authorization (Future)**
   - Implement authentication middleware
   - Enable RLS policies
   - Replace hardcoded user_id with auth.uid()
   - Add rate limiting
   - Security audit

---

## 7. Key Implementation Notes

### 7.1 Astro API Route Structure (Development Phase)
```typescript
// src/pages/api/flashcards.ts
export const prerender = false;

import type { APIContext } from "astro";
import type { SupabaseClient } from "../../db/supabase.client";

// Hardcoded test user ID for manual testing
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient;
  // Use TEST_USER_ID instead of authenticated user
  // Implementation
}

export async function POST(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient;
  // Use TEST_USER_ID instead of authenticated user
  // Implementation
}
```

### 7.2 Supabase Client Usage
```typescript
// Get Supabase client from context.locals
const supabase = context.locals.supabase as SupabaseClient;

// Use hardcoded TEST_USER_ID for all database operations
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

// Never import and use supabaseClient directly in API routes
// import { supabaseClient } from "../../db/supabase.client"; ❌
```

### 7.3 TypeScript Type Safety
```typescript
// Use SupabaseClient from our custom type
import type { SupabaseClient } from "../../db/supabase.client";

// Not from @supabase/supabase-js
// import type { SupabaseClient } from "@supabase/supabase-js"; ❌
```

### 7.4 Content Sanitization
```typescript
// Implement XSS prevention for user-generated content
import DOMPurify from "isomorphic-dompurify";

function sanitizeFlashcard(card: { front: string; back: string }) {
  return {
    front: DOMPurify.sanitize(card.front, { ALLOWED_TAGS: [] }),
    back: DOMPurify.sanitize(card.back, { ALLOWED_TAGS: [] }),
  };
}
```

### 7.5 Middleware Setup (Development Phase)
```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client without authentication checks
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, options),
        remove: (key, options) => context.cookies.delete(key, options),
      },
    }
  );

  // Attach Supabase client to context.locals
  context.locals.supabase = supabase;

  // Skip authentication - proceed directly to endpoint
  return next();
});
```

---

## Summary

This implementation plan is adapted for the **development and manual testing phase**. Key differences from production:

✅ **Enabled**:
- Validation with Zod schemas
- Error handling and proper status codes
- Service layer architecture
- Database operations via Supabase

⚠️ **Disabled/Modified**:
- Authentication and authorization (using hardcoded `TEST_USER_ID`)
- RLS policies (will be enabled later)
- Rate limiting (will be implemented later)
- Automated tests (manual testing instead)

Once manual testing is complete and endpoints are verified to work correctly, the plan includes **Phase 6** to add authentication, RLS, and rate limiting.

Follow the implementation phases in order and refer to specific endpoint sections for detailed guidance.
