export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";

import type { SupabaseClient } from "../../../db/supabase.client";
import { internalError, unauthorizedError, validationError } from "../../../lib/helpers/error.helper";
import { getGenerationStatistics } from "../../../lib/services/generation.service";
import { generationStatisticsQuerySchema, type GenerationStatisticsQuery } from "../../../lib/validation/schemas";

/**
 * GET /api/generations/statistics
 * Get aggregated statistics about AI generation effectiveness
 *
 * Query parameters:
 * - period (string, optional, enum: 'week' | 'month' | 'all', default: 'all')
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Verify user authentication
    const session = await context.locals.session;
    if (!session?.user) {
      return unauthorizedError("Musisz być zalogowany");
    }

    const supabase = context.locals.supabase as SupabaseClient;

    // Extract query parameters from URL
    const url = new URL(context.request.url);
    const queryParams = {
      period: url.searchParams.get("period"),
    };

    // Validate query parameters using Zod schema
    let validated: GenerationStatisticsQuery;
    try {
      validated = generationStatisticsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError("Invalid query parameters", {
          errors: error.errors,
        });
      }
      throw error;
    }

    // Call service to get statistics
    const result = await getGenerationStatistics(supabase, session.user.id, validated.period);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/generations/statistics:", error);
    return internalError("Failed to retrieve generation statistics", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
