export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";

import type { SupabaseClient } from "../../../db/supabase.client";
import {
  errorResponse,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from "../../../lib/helpers/error.helper";
import { bulkCreateFlashcards } from "../../../lib/services/flashcard.service";
import { bulkCreateFlashcardsSchema, type BulkCreateFlashcardsInput } from "../../../lib/validation/schemas";

/**
 * POST /api/flashcards/bulk
 * Bulk create flashcards from AI generation
 *
 * Request body:
 * {
 *   "generation_id": number,
 *   "flashcards": [
 *     {
 *       "front": "string (1-200)",
 *       "back": "string (1-500)",
 *       "source": "ai-full" | "ai-edited"
 *     }
 *   ]
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
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON format", 422);
    }

    // Validate request body using Zod schema
    let validated: BulkCreateFlashcardsInput;
    try {
      validated = bulkCreateFlashcardsSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid request body", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Bulk create flashcards using service
    let result;
    try {
      result = await bulkCreateFlashcards(supabase, user.id, validated);
    } catch (error) {
      // Check if it's a "generation not found" error
      if (error instanceof Error && error.message === "Generation not found") {
        return notFoundError("Generation not found");
      }
      throw error;
    }

    // Return created flashcards with 201 status
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return internalError("Failed to bulk create flashcards", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
