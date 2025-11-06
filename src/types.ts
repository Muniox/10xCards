import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Flashcard DTOs and Commands
// ============================================================================

/**
 * Valid flashcard source types
 * - ai-full: Flashcard accepted from AI generation without edits
 * - ai-edited: Flashcard from AI generation that was edited before acceptance
 * - manual: Flashcard created manually by the user
 */
export type FlashcardSource = "ai-full" | "ai-edited" | "manual";

/**
 * Flashcard Data Transfer Object
 * Represents a flashcard as returned by the API.
 * Omits user_id from the database model for security.
 */
export type FlashcardDTO = Omit<Tables<"flashcards">, "user_id" | "source"> & {
  source: FlashcardSource;
};

/**
 * Command for creating a single manual flashcard
 * POST /api/flashcards
 * Only requires front and back text from the user.
 */
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back">;

/**
 * Flashcard data structure for bulk creation
 * Used within BulkCreateFlashcardsCommand.
 * Requires front, back, and source (ai-full or ai-edited).
 */
export type FlashcardForBulkCreate = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
  source: FlashcardSource;
};

/**
 * Command for bulk creating flashcards from AI generation
 * POST /api/flashcards/bulk
 * Associates multiple flashcards with a generation session.
 */
export interface BulkCreateFlashcardsCommand {
  generation_id: number;
  flashcards: FlashcardForBulkCreate[];
}

/**
 * Response for bulk flashcard creation
 * Returns the count of created flashcards and their full data.
 */
export interface BulkCreateFlashcardsResponse {
  created_count: number;
  flashcards: FlashcardDTO[];
}

/**
 * Command for updating an existing flashcard
 * PATCH /api/flashcards/:id
 * Both fields are optional to allow partial updates.
 */
export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination metadata
 * Included in all paginated list responses.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Paginated response for flashcard list
 * GET /api/flashcards
 */
export interface PaginatedFlashcardsResponse {
  data: FlashcardDTO[];
  pagination: PaginationMeta;
}

// ============================================================================
// AI Generation DTOs and Commands
// ============================================================================

/**
 * Command for generating flashcard suggestions from text
 * POST /api/generations
 * The model parameter is optional and will use a default if not provided.
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
  model?: string;
}

/**
 * A single flashcard suggestion from AI generation
 * Returned as part of GenerationResultDTO but not yet saved to database.
 */
export interface FlashcardSuggestion {
  front: string;
  back: string;
}

/**
 * Result of AI flashcard generation
 * POST /api/generations response
 * Combines generation metadata with suggested flashcards.
 */
export interface GenerationResultDTO {
  generation_id: number;
  model: string;
  generated_count: number;
  generation_duration: number;
  suggestions: FlashcardSuggestion[];
  created_at: string;
}

/**
 * Generation Data Transfer Object
 * Represents a generation record as returned by the API.
 * Omits sensitive fields like user_id and source_text_hash.
 */
export type GenerationDTO = Omit<Tables<"generations">, "user_id" | "source_text_hash" | "updated_at">;

/**
 * Paginated response for generation list
 * GET /api/generations
 */
export interface PaginatedGenerationsResponse {
  data: GenerationDTO[];
  pagination: PaginationMeta;
}

/**
 * Aggregated statistics about AI generation effectiveness
 * GET /api/generations/statistics
 * Calculated from multiple generation records.
 */
export interface GenerationStatisticsDTO {
  total_generations: number;
  total_generated_flashcards: number;
  total_accepted_flashcards: number;
  total_accepted_unedited: number;
  total_accepted_edited: number;
  acceptance_rate: number;
  unedited_acceptance_rate: number;
  average_generation_duration: number;
  most_used_model: string;
  period: "week" | "month" | "all";
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error response structure
 * Used consistently across all API endpoints.
 */
export interface ErrorResponse {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "RATE_LIMIT_ERROR" | "AI_SERVICE_ERROR" | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
}
