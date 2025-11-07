import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Helper to convert null/empty string to undefined for optional query params
 */
const nullishString = (val: unknown) => {
  if (val === null || val === undefined || val === "") return undefined;
  return val;
};

/**
 * Pagination parameters schema
 * Used for GET /api/flashcards and GET /api/generations
 */
export const paginationSchema = z.object({
  page: z.preprocess(nullishString, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(nullishString, z.coerce.number().int().min(1).max(100).default(20)),
});

// ============================================================================
// Flashcard Schemas
// ============================================================================

/**
 * Flashcard content validation (front and back text)
 */
export const flashcardContentSchema = z.object({
  front: z.string().min(1, "Front text is required").max(200, "Front text must be 200 characters or less"),
  back: z.string().min(1, "Back text is required").max(500, "Back text must be 500 characters or less"),
});

/**
 * Flashcard source type validation
 */
export const flashcardSourceSchema = z.enum(["ai-full", "ai-edited", "manual"]);

/**
 * Query parameters for GET /api/flashcards
 */
export const listFlashcardsQuerySchema = paginationSchema.extend({
  source: z.preprocess(nullishString, flashcardSourceSchema.optional()),
  generation_id: z.preprocess(nullishString, z.coerce.number().int().positive().optional()),
});

/**
 * URL parameter validation for flashcard ID
 */
export const flashcardIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Request body for POST /api/flashcards (create manual flashcard)
 */
export const createFlashcardSchema = flashcardContentSchema;

/**
 * Request body for PATCH /api/flashcards/:id (update flashcard)
 * At least one field must be provided
 */
export const updateFlashcardSchema = flashcardContentSchema
  .partial()
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Request body for POST /api/flashcards/bulk (bulk create flashcards)
 */
export const bulkCreateFlashcardsSchema = z.object({
  generation_id: z.number().int().positive(),
  flashcards: z
    .array(
      flashcardContentSchema.extend({
        source: z.enum(["ai-full", "ai-edited"]), // Only AI sources allowed in bulk
      })
    )
    .min(1, "At least one flashcard is required")
    .max(50, "Maximum 50 flashcards per request"),
});

// ============================================================================
// Generation Schemas
// ============================================================================

/**
 * Request body for POST /api/generations (generate flashcard suggestions)
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must be 10000 characters or less"),
  model: z.string().optional(),
});

/**
 * Query parameters for GET /api/generations
 */
export const listGenerationsQuerySchema = paginationSchema;

/**
 * Query parameters for GET /api/generations/statistics
 */
export const generationStatisticsQuerySchema = z.object({
  period: z.preprocess(nullishString, z.enum(["week", "month", "all"]).default("all")),
});

// ============================================================================
// Type Exports (for TypeScript inference)
// ============================================================================

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
export type FlashcardIdParam = z.infer<typeof flashcardIdParamSchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type BulkCreateFlashcardsInput = z.infer<typeof bulkCreateFlashcardsSchema>;
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
export type ListGenerationsQuery = z.infer<typeof listGenerationsQuerySchema>;
export type GenerationStatisticsQuery = z.infer<typeof generationStatisticsQuerySchema>;
