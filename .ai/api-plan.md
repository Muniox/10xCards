# REST API Plan for 10xCards

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Flashcards | `flashcards` | Individual flashcard items with front/back content |
| Generations | `generations` | Records of AI generation sessions |
| Generation Statistics | `generations` (aggregated) | Analytics about AI generation effectiveness |

## 2. Endpoints

### 2.1. Flashcard Management

#### List Flashcards

- **Method**: `GET`
- **Path**: `/api/flashcards`
- **Description**: Retrieve paginated list of flashcards with optional filtering
- **Query Parameters**:
  - `page` (number, optional, default: 1): Page number for pagination
  - `limit` (number, optional, default: 20, max: 100): Items per page
  - `source` (string, optional): Filter by source type ('ai-full', 'ai-edited', 'manual')
  - `generation_id` (number, optional): Filter by specific generation
- **Request Body**: None
- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals",
      "source": "ai-full",
      "generation_id": 45,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters

#### Get Single Flashcard

- **Method**: `GET`
- **Path**: `/api/flashcards/:id`
- **Description**: Retrieve a specific flashcard by ID
- **URL Parameters**:
  - `id` (number, required): Flashcard ID
- **Request Body**: None
- **Response** (200 OK):
```json
{
  "id": 123,
  "front": "What is spaced repetition?",
  "back": "A learning technique that involves reviewing information at increasing intervals",
  "source": "ai-full",
  "generation_id": 45,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```
- **Error Responses**:
  - `404 Not Found`: Flashcard doesn't exist
  - `400 Bad Request`: Invalid ID format

#### Create Manual Flashcard

- **Method**: `POST`
- **Path**: `/api/flashcards`
- **Description**: Create a single flashcard manually
- **Request Body**:
```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```
- **Validation Rules**:
  - `front`: Required, string, 1-200 characters
  - `back`: Required, string, 1-500 characters
- **Response** (201 Created):
```json
{
  "id": 124,
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "generation_id": null,
  "created_at": "2025-01-15T11:00:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation errors
  - `422 Unprocessable Entity`: Invalid data format

#### Create Multiple Flashcards from Generation

- **Method**: `POST`
- **Path**: `/api/flashcards/bulk`
- **Description**: Save multiple flashcards from an AI generation session
- **Request Body**:
```json
{
  "generation_id": 45,
  "flashcards": [
    {
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals",
      "source": "ai-full"
    },
    {
      "front": "What is active recall?",
      "back": "A learning principle where you actively stimulate memory during the learning process",
      "source": "ai-edited"
    }
  ]
}
```
- **Validation Rules**:
  - `generation_id`: Required, must exist
  - `flashcards`: Required, array with 1-50 items
  - Each flashcard:
    - `front`: Required, string, 1-200 characters
    - `back`: Required, string, 1-500 characters
    - `source`: Required, must be 'ai-full' or 'ai-edited'
- **Response** (201 Created):
```json
{
  "created_count": 2,
  "flashcards": [
    {
      "id": 125,
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals",
      "source": "ai-full",
      "generation_id": 45,
      "created_at": "2025-01-15T11:05:00Z",
      "updated_at": "2025-01-15T11:05:00Z"
    },
    {
      "id": 126,
      "front": "What is active recall?",
      "back": "A learning principle where you actively stimulate memory during the learning process",
      "source": "ai-edited",
      "generation_id": 45,
      "created_at": "2025-01-15T11:05:00Z",
      "updated_at": "2025-01-15T11:05:00Z"
    }
  ]
}
```
- **Side Effects**: Updates `accepted_unedited_count` and `accepted_edited_count` in the corresponding generation record
- **Error Responses**:
  - `400 Bad Request`: Validation errors
  - `404 Not Found`: Generation ID not found
  - `422 Unprocessable Entity`: Invalid data format

#### Update Flashcard

- **Method**: `PATCH`
- **Path**: `/api/flashcards/:id`
- **Description**: Update an existing flashcard's content
- **URL Parameters**:
  - `id` (number, required): Flashcard ID
- **Request Body**:
```json
{
  "front": "What is spaced repetition learning?",
  "back": "A learning technique that involves reviewing information at systematically increasing intervals to improve long-term retention"
}
```
- **Validation Rules**:
  - At least one field must be provided
  - `front`: Optional, string, 1-200 characters
  - `back`: Optional, string, 1-500 characters
- **Business Logic**: If the flashcard source is 'ai-full', it will be changed to 'ai-edited' upon update
- **Response** (200 OK):
```json
{
  "id": 123,
  "front": "What is spaced repetition learning?",
  "back": "A learning technique that involves reviewing information at systematically increasing intervals to improve long-term retention",
  "source": "ai-edited",
  "generation_id": 45,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:10:00Z"
}
```
- **Error Responses**:
  - `404 Not Found`: Flashcard doesn't exist
  - `400 Bad Request`: Validation errors or no fields provided
  - `422 Unprocessable Entity`: Invalid data format

#### Delete Flashcard

- **Method**: `DELETE`
- **Path**: `/api/flashcards/:id`
- **Description**: Permanently delete a flashcard
- **URL Parameters**:
  - `id` (number, required): Flashcard ID
- **Request Body**: None
- **Response** (204 No Content): Empty response body
- **Error Responses**:
  - `404 Not Found`: Flashcard doesn't exist
  - `400 Bad Request`: Invalid ID format

### 2.2. AI Generation

#### Generate Flashcard Suggestions

- **Method**: `POST`
- **Path**: `/api/generations`
- **Description**: Generate flashcard suggestions from provided text using AI
- **Request Body**:
```json
{
  "source_text": "Spaced repetition is a learning technique that incorporates increasing intervals of time between subsequent review of previously learned material in order to exploit the psychological spacing effect...",
  "model": "openai/gpt-4"
}
```
- **Validation Rules**:
  - `source_text`: Required, string, 1000-10000 characters
  - `model`: Optional, string, defaults to configured default model
- **Response** (200 OK):
```json
{
  "generation_id": 46,
  "model": "openai/gpt-4",
  "generated_count": 5,
  "generation_duration": 3500,
  "suggestions": [
    {
      "front": "What is spaced repetition?",
      "back": "A learning technique that incorporates increasing intervals of time between subsequent review of previously learned material"
    },
    {
      "front": "What psychological effect does spaced repetition exploit?",
      "back": "The spacing effect"
    }
  ],
  "created_at": "2025-01-15T11:15:00Z"
}
```
- **Business Logic**:
  - Creates a generation record with initial statistics
  - Calls OpenRouter API with the provided text
  - Hashes source text for deduplication tracking
  - Records generation duration
  - Returns suggestions without saving them as flashcards
- **Error Responses**:
  - `400 Bad Request`: Text length outside 1000-10000 range
  - `422 Unprocessable Entity`: Invalid data format
  - `500 Internal Server Error`: AI API failure (error logged to generation_error_logs)
  - `503 Service Unavailable`: AI service temporarily unavailable

#### List Generations

- **Method**: `GET`
- **Path**: `/api/generations`
- **Description**: Retrieve paginated list of AI generation sessions
- **Query Parameters**:
  - `page` (number, optional, default: 1): Page number
  - `limit` (number, optional, default: 20, max: 100): Items per page
- **Request Body**: None
- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": 46,
      "model": "openai/gpt-4",
      "generated_count": 5,
      "accepted_unedited_count": 3,
      "accepted_edited_count": 1,
      "source_text_length": 2500,
      "generation_duration": 3500,
      "created_at": "2025-01-15T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "total_pages": 1
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters

#### Get Generation Statistics

- **Method**: `GET`
- **Path**: `/api/generations/statistics`
- **Description**: Retrieve aggregated statistics about AI generation effectiveness
- **Query Parameters**:
  - `period` (string, optional): Filter by time period ('week', 'month', 'all'), default: 'all'
- **Request Body**: None
- **Response** (200 OK):
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
- **Error Responses**:
  - `400 Bad Request`: Invalid period parameter

## 3. Validation and Business Logic

### 3.1. Input Validation Rules

All validation is implemented using **Zod schemas** in API endpoints:

#### Flashcard Validation
```typescript
{
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(['ai-full', 'ai-edited', 'manual'])
}
```

#### Generation Validation
```typescript
{
  source_text: z.string().min(1000).max(10000),
  model: z.string().optional()
}
```

#### Pagination Validation
```typescript
{
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
}
```

### 3.2. Business Logic Implementation

#### AI Generation Flow
1. Validate source text length (1000-10000 characters)
2. Hash source text using SHA-256 for deduplication tracking
3. Create generation record with initial metadata
4. Call OpenRouter API with configured model
5. Parse and validate AI response
6. Record generation duration
7. Return suggestions to user for review
8. On error: Log to `generation_error_logs` table and return user-friendly error

#### Flashcard Acceptance Flow
1. Verify generation_id exists
2. Validate each flashcard in the bulk request
3. Insert flashcards with appropriate source tags
4. Update generation record:
   - Increment `accepted_unedited_count` for 'ai-full' flashcards
   - Increment `accepted_edited_count` for 'ai-edited' flashcards
5. Return created flashcards

#### Flashcard Update Logic
1. If source is 'ai-full', change to 'ai-edited'
2. Update content fields
3. Update `updated_at` timestamp (via trigger)
4. Return updated flashcard

### 3.3. Error Handling Strategy

All endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text exceeds maximum length of 200 characters",
    "details": {
      "field": "front",
      "constraint": "max_length",
      "max": 200,
      "actual": 250
    }
  }
}
```

**Error Categories**:
- `VALIDATION_ERROR` (400): Input validation failures
- `NOT_FOUND` (404): Resource doesn't exist
- `RATE_LIMIT_ERROR` (429): Too many requests
- `AI_SERVICE_ERROR` (500/503): External AI API failures
- `INTERNAL_ERROR` (500): Unexpected server errors

**Error Logging**:
- AI generation errors are logged to `generation_error_logs` table
- All server errors are logged with stack traces for debugging
- User-facing error messages are sanitized to avoid exposing sensitive information

### 3.4. Performance Optimizations

1. **Database Indexes**: All foreign keys are indexed
2. **Pagination**: All list endpoints support pagination to limit result sets
3. **Selective Fields**: Only necessary fields are returned in responses
4. **Connection Pooling**: Supabase manages database connection pooling
5. **Caching Strategy**:
   - Generation results are not cached (always fresh)
   - Flashcard lists can be cached client-side with invalidation on mutations

### 3.5. Rate Limiting

Rate limiting is implemented in Astro middleware (`src/middleware/index.ts`) to protect against abuse and control AI API costs.

**Implementation Strategy**:
- Use in-memory cache (or Redis for production) to track request counts per IP address
- Apply different limits based on endpoint path
- Reset counters using sliding window algorithm

**Rate Limits**:
- **Generation Endpoint** (`/api/generations`): 10 requests per hour per IP
- **Other Endpoints**: 100 requests per minute per IP

**Middleware Logic**:
```typescript
// Pseudo-code for middleware implementation
export const onRequest = defineMiddleware(async (context, next) => {
  const ip = context.clientAddress;
  const path = context.url.pathname;

  // Check rate limit for this IP and path
  const limit = path.includes('/generations') ? { max: 10, window: 3600 } : { max: 100, window: 60 };
  const { allowed, remaining, reset } = checkRateLimit(ip, path, limit);

  if (!allowed) {
    return new Response(JSON.stringify({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.'
      }
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit.max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset)
      }
    });
  }

  const response = await next();

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', String(limit.max));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));

  return response;
});
```

**Rate Limit Headers** (included in all responses):
- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets
