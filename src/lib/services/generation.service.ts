import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GenerationResultDTO,
  FlashcardSuggestion,
  PaginatedGenerationsResponse,
  GenerationDTO,
  GenerationStatisticsDTO,
} from "../../types";
import { OpenRouterService, OpenRouterError } from "./openrouter";
import type { JSONSchema } from "./openrouter";

/**
 * Singleton instance of OpenRouter service
 */
let openRouterService: OpenRouterService | null = null;

/**
 * Get or create OpenRouter service instance
 * @returns OpenRouter service instance
 * @throws {Error} If OPENROUTER_API_KEY is not configured
 */
function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    openRouterService = new OpenRouterService({
      apiKey,
      httpReferer: import.meta.env.SITE || "https://10xcards.app",
      appTitle: "10xCards",
    });
  }
  return openRouterService;
}

/**
 * JSON Schema for flashcard generation response
 */
const flashcardSchema: JSONSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string", maxLength: 200 },
          back: { type: "string", maxLength: 500 },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 8,
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

/**
 * Hash source text using SHA-256
 * @param text - Source text to hash
 * @returns Hex string hash
 */
async function hashSourceText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Call OpenRouter API to generate flashcard suggestions
 * @param model - AI model to use
 * @param sourceText - Source text to generate flashcards from
 * @returns Array of flashcard suggestions
 * @throws {Error} If OpenRouter API error occurs or response is invalid
 */
async function callOpenRouterAPI(model: string, sourceText: string): Promise<FlashcardSuggestion[]> {
  const service = getOpenRouterService();

  const systemPrompt = `You are a flashcard generator. Generate high-quality flashcards from the provided text.
Rules:
- Generate 3-8 flashcards depending on content length and complexity
- Front: A clear question or prompt (max 200 chars)
- Back: A concise answer (max 500 chars)
- Focus on key concepts, definitions, and important facts
- Ensure flashcards are independent and self-contained`;

  try {
    const response = await service.completeWithSchema<{ flashcards: FlashcardSuggestion[] }>({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate flashcards from this text:\n\n${sourceText}`,
        },
      ],
      model,
      schema: flashcardSchema,
      schemaName: "flashcard_generation_response",
      temperature: 0.7,
      maxTokens: 2000,
    });

    return response.content.flashcards;
  } catch (error) {
    // Map OpenRouter errors to generation errors
    if (error instanceof OpenRouterError) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate flashcard suggestions from source text using AI
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param sourceText - Source text to generate from
 * @param model - AI model to use (optional, defaults to gpt-4)
 * @returns Generation result with suggestions
 */
export async function generateFlashcards(
  supabase: SupabaseClient,
  userId: string,
  sourceText: string,
  model?: string
): Promise<GenerationResultDTO> {
  // Set default model if not provided
  const selectedModel = model || "openai/gpt-4o-mini";

  // Hash source text
  const sourceTextHash = await hashSourceText(sourceText);
  const sourceTextLength = sourceText.length;

  // Start timer
  const startTime = Date.now();

  try {
    // Create generation record with initial data
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        model: selectedModel,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generated_count: 0,
        generation_duration: 0,
        accepted_unedited_count: null,
        accepted_edited_count: null,
      })
      .select()
      .single();

    if (insertError || !generation) {
      throw new Error(`Failed to create generation record: ${insertError?.message}`);
    }

    // Call OpenRouter API
    const suggestions = await callOpenRouterAPI(selectedModel, sourceText);

    // Stop timer
    const generationDuration = Date.now() - startTime;

    // Update generation record with results
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        generated_count: suggestions.length,
        generation_duration: generationDuration,
      })
      .eq("id", generation.id);

    if (updateError) {
      // Error updating generation record - non-critical
      // The generation was successful, we just couldn't save the statistics
    }

    // Return result
    return {
      generation_id: generation.id,
      model: selectedModel,
      generated_count: suggestions.length,
      generation_duration: generationDuration,
      suggestions,
      created_at: generation.created_at,
    };
  } catch (error) {
    // Log error to generation_error_logs
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode =
      error instanceof Error && error.message.includes("OpenRouter") ? "AI_API_ERROR" : "INTERNAL_ERROR";

    await supabase
      .from("generation_error_logs")
      .insert({
        user_id: userId,
        model: selectedModel,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: errorCode,
        error_message: errorMessage,
      })
      .then(({ error: logError }) => {
        if (logError) {
          // Silently fail - error logging is not critical
          // The main error will still be thrown below
        }
      });

    // Re-throw error
    throw error;
  }
}

/**
 * List generations with pagination
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param pagination - Page number and limit
 * @returns Paginated generation list
 */
export async function listGenerations(
  supabase: SupabaseClient,
  userId: string,
  pagination: {
    page: number;
    limit: number;
  }
): Promise<PaginatedGenerationsResponse> {
  // Build query
  const offset = (pagination.page - 1) * pagination.limit;

  const { data, error, count } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pagination.limit - 1);

  if (error) {
    throw new Error(`Failed to list generations: ${error.message}`);
  }

  // Transform to DTOs (omit user_id, source_text_hash, updated_at)
  const generations: GenerationDTO[] =
    data?.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, source_text_hash, updated_at, ...rest } = item;
      return rest;
    }) ?? [];

  // Calculate pagination metadata
  const total = count ?? 0;
  const total_pages = Math.ceil(total / pagination.limit);

  return {
    data: generations,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages,
    },
  };
}

/**
 * Get generation statistics
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param period - Time period filter ('week' | 'month' | 'all')
 * @returns Aggregated statistics
 */
export async function getGenerationStatistics(
  supabase: SupabaseClient,
  userId: string,
  period: "week" | "month" | "all"
): Promise<GenerationStatisticsDTO> {
  // Build date filter based on period
  let dateFilter = "";
  if (period === "week") {
    dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
  } else if (period === "month") {
    dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
  }

  // Build query with aggregations
  let query = supabase.from("generations").select("*").eq("user_id", userId);

  if (dateFilter) {
    query = query.filter(
      "created_at",
      "gte",
      period === "week"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get generation statistics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // Return empty statistics
    return {
      total_generations: 0,
      total_generated_flashcards: 0,
      total_accepted_flashcards: 0,
      total_accepted_unedited: 0,
      total_accepted_edited: 0,
      acceptance_rate: 0,
      unedited_acceptance_rate: 0,
      average_generation_duration: 0,
      most_used_model: "",
      period,
    };
  }

  // Calculate statistics manually
  const totalGenerations = data.length;
  const totalGenerated = data.reduce((sum, g) => sum + (g.generated_count || 0), 0);
  const totalAcceptedUnedited = data.reduce((sum, g) => sum + (g.accepted_unedited_count || 0), 0);
  const totalAcceptedEdited = data.reduce((sum, g) => sum + (g.accepted_edited_count || 0), 0);
  const totalAccepted = totalAcceptedUnedited + totalAcceptedEdited;
  const avgDuration = data.reduce((sum, g) => sum + (g.generation_duration || 0), 0) / totalGenerations;

  // Find most used model
  const modelCounts = data.reduce(
    (acc, g) => {
      acc[g.model] = (acc[g.model] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const mostUsedModel = Object.entries(modelCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "";

  // Calculate rates
  const acceptanceRate = totalGenerated > 0 ? totalAccepted / totalGenerated : 0;
  const uneditedAcceptanceRate = totalGenerated > 0 ? totalAcceptedUnedited / totalGenerated : 0;

  return {
    total_generations: totalGenerations,
    total_generated_flashcards: totalGenerated,
    total_accepted_flashcards: totalAccepted,
    total_accepted_unedited: totalAcceptedUnedited,
    total_accepted_edited: totalAcceptedEdited,
    acceptance_rate: acceptanceRate,
    unedited_acceptance_rate: uneditedAcceptanceRate,
    average_generation_duration: Math.round(avgDuration),
    most_used_model: mostUsedModel,
    period,
  };
}
