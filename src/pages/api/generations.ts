export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";

import type { SupabaseClient } from "../../db/supabase.client";
import { aiServiceError, errorResponse, internalError, validationError } from "../../lib/helpers/error.helper";
import { generateFlashcards, listGenerations } from "../../lib/services/generation.service";
import {
  generateFlashcardsSchema,
  listGenerationsQuerySchema,
  type GenerateFlashcardsInput,
  type ListGenerationsQuery,
} from "../../lib/validation/schemas";

// Hardcoded test user ID for manual testing phase
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * POST /api/generations
 * Generate flashcard suggestions from source text using AI
 *
 * Request body:
 * {
 *   "source_text": "string (1000-10000 chars)",
 *   "model": "string (optional)"
 * }
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase as SupabaseClient;

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch (error) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON format", 422);
    }

    // Validate request body using Zod schema
    let validated: GenerateFlashcardsInput;
    try {
      validated = generateFlashcardsSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid request body", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Generate flashcards using service
    let result;
    try {
      result = await generateFlashcards(supabase, TEST_USER_ID, validated.source_text, validated.model);
    } catch (error) {
      // Check if it's an AI service error
      if (error instanceof Error) {
        if (error.message.includes("OPENROUTER_API_KEY")) {
          return aiServiceError("AI service is not configured", 503);
        }
        if (error.message.includes("OpenRouter")) {
          return aiServiceError(`AI service error: ${error.message}`, 500);
        }
        if (error.message.includes("parse") || error.message.includes("invalid")) {
          return aiServiceError("AI returned invalid response format", 500);
        }
      }
      throw error;
    }

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/generations:", error);
    return internalError("Failed to generate flashcards", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/generations
 * List generations with pagination
 *
 * Query parameters:
 * - page (number, optional, default: 1, min: 1)
 * - limit (number, optional, default: 20, min: 1, max: 100)
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase as SupabaseClient;

    // Extract query parameters from URL
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    // Validate query parameters using Zod schema
    let validated: ListGenerationsQuery;
    try {
      validated = listGenerationsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid query parameters", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Build pagination object
    const pagination = {
      page: validated.page,
      limit: validated.limit,
    };

    // Call service to get generations
    const result = await listGenerations(supabase, TEST_USER_ID, pagination);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/generations:", error);
    return internalError("Failed to retrieve generations", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
