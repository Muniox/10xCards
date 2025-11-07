export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";

import type { SupabaseClient } from "../../../db/supabase.client";
import { internalError, notFoundError, validationError } from "../../../lib/helpers/error.helper";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcard.service";
import {
  flashcardIdParamSchema,
  updateFlashcardSchema,
  type FlashcardIdParam,
  type UpdateFlashcardInput,
} from "../../../lib/validation/schemas";

// Hardcoded test user ID for manual testing phase
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * GET /api/flashcards/:id
 * Get a single flashcard by ID
 *
 * URL parameters:
 * - id (number, required, positive integer)
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase as SupabaseClient;

    // Extract and validate ID from URL parameters
    let validated: FlashcardIdParam;
    try {
      validated = flashcardIdParamSchema.parse({
        id: context.params.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid flashcard ID", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Get flashcard from service
    const flashcard = await getFlashcardById(supabase, TEST_USER_ID, validated.id);

    // Return 404 if not found
    if (!flashcard) {
      return notFoundError("Flashcard not found");
    }

    // Return successful response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards/:id:", error);
    return internalError("Failed to retrieve flashcard", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * PATCH /api/flashcards/:id
 * Update an existing flashcard
 *
 * URL parameters:
 * - id (number, required, positive integer)
 *
 * Request body (at least one required):
 * {
 *   "front": "string (1-200 chars)",
 *   "back": "string (1-500 chars)"
 * }
 */
export async function PATCH(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase as SupabaseClient;

    // Extract and validate ID from URL parameters
    let validatedId: FlashcardIdParam;
    try {
      validatedId = flashcardIdParamSchema.parse({
        id: context.params.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid flashcard ID", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch (error) {
      return validationError("Invalid JSON format", undefined);
    }

    // Validate request body using Zod schema
    let validated: UpdateFlashcardInput;
    try {
      validated = updateFlashcardSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid request body", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Update flashcard using service
    const flashcard = await updateFlashcard(supabase, TEST_USER_ID, validatedId.id, validated);

    // Return 404 if not found
    if (!flashcard) {
      return notFoundError("Flashcard not found");
    }

    // Return updated flashcard
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/flashcards/:id:", error);
    return internalError("Failed to update flashcard", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * DELETE /api/flashcards/:id
 * Delete a flashcard
 *
 * URL parameters:
 * - id (number, required, positive integer)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase as SupabaseClient;

    // Extract and validate ID from URL parameters
    let validated: FlashcardIdParam;
    try {
      validated = flashcardIdParamSchema.parse({
        id: context.params.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid flashcard ID", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Delete flashcard using service
    const deleted = await deleteFlashcard(supabase, TEST_USER_ID, validated.id);

    // Return 404 if not found
    if (!deleted) {
      return notFoundError("Flashcard not found");
    }

    // Return 204 No Content on successful deletion
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error in DELETE /api/flashcards/:id:", error);
    return internalError("Failed to delete flashcard", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
