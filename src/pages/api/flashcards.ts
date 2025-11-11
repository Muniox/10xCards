export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";

import type { SupabaseClient } from "../../db/supabase.client";
import { errorResponse, internalError, unauthorizedError, validationError } from "../../lib/helpers/error.helper";
import { listFlashcards, createManualFlashcard } from "../../lib/services/flashcard.service";
import {
  listFlashcardsQuerySchema,
  createFlashcardSchema,
  type ListFlashcardsQuery,
  type CreateFlashcardInput,
} from "../../lib/validation/schemas";

/**
 * GET /api/flashcards
 * List flashcards with optional filtering and pagination
 *
 * Query parameters:
 * - page (number, optional, default: 1, min: 1)
 * - limit (number, optional, default: 20, min: 1, max: 100)
 * - source (string, optional, enum: 'ai-full' | 'ai-edited' | 'manual')
 * - generation_id (number, optional)
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Verify user authentication
    const user = context.locals.user;
    if (!user) {
      return unauthorizedError("Musisz być zalogowany");
    }

    const supabase = context.locals.supabase as SupabaseClient;

    // Extract query parameters from URL
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      source: url.searchParams.get("source"),
      generation_id: url.searchParams.get("generation_id"),
    };

    // Validate query parameters using Zod schema
    let validated: ListFlashcardsQuery;
    try {
      validated = listFlashcardsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid query parameters", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Build filters object
    const filters = {
      source: validated.source,
      generation_id: validated.generation_id,
    };

    // Build pagination object
    const pagination = {
      page: validated.page,
      limit: validated.limit,
    };

    // Call service to get flashcards
    const result = await listFlashcards(supabase, user.id, filters, pagination);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards:", error);
    return internalError("Failed to retrieve flashcards", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/flashcards
 * Create a manual flashcard
 *
 * Request body:
 * {
 *   "front": "string (1-200 chars)",
 *   "back": "string (1-500 chars)"
 * }
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Verify user authentication
    const user = context.locals.user;
    if (!user) {
      return unauthorizedError("Musisz być zalogowany");
    }

    const supabase = context.locals.supabase as SupabaseClient;

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch (error) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON format", 422);
    }

    // Validate request body using Zod schema
    let validated: CreateFlashcardInput;
    try {
      validated = createFlashcardSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid request body", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Create flashcard using service
    const flashcard = await createManualFlashcard(supabase, user.id, validated);

    // Return created flashcard with 201 status
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/flashcards:", error);
    return internalError("Failed to create flashcard", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
