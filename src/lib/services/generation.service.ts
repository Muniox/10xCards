import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GenerationResultDTO,
  FlashcardSuggestion,
  PaginatedGenerationsResponse,
  GenerationDTO,
  GenerationStatisticsDTO,
} from "../../types";

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
 */
async function callOpenRouterAPI(model: string, sourceText: string): Promise<FlashcardSuggestion[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = `You are a flashcard generator. Generate high-quality flashcards from the provided text.
Rules:
- Generate 3-8 flashcards depending on content length and complexity
- Front: A clear question or prompt (max 200 chars)
- Back: A concise answer (max 500 chars)
- Focus on key concepts, definitions, and important facts
- Ensure flashcards are independent and self-contained
- Return ONLY valid JSON array with structure: [{"front": "...", "back": "..."}]`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": import.meta.env.SITE || "https://10xcards.app",
      "X-Title": "10xCards",
    },
    body: JSON.stringify({
      model,
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
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response structure from OpenRouter API");
  }

  const content = data.choices[0].message.content;

  // Parse JSON response
  let suggestions: FlashcardSuggestion[];
  try {
    // Try to extract JSON array from response (AI might wrap it in markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in AI response");
    }
    suggestions = JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Validate suggestions structure
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error("AI returned invalid or empty flashcard array");
  }

  for (const suggestion of suggestions) {
    if (
      !suggestion.front ||
      !suggestion.back ||
      typeof suggestion.front !== "string" ||
      typeof suggestion.back !== "string"
    ) {
      throw new Error("AI returned flashcard with invalid structure");
    }
  }

  return suggestions;
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
      console.error("Failed to update generation record:", updateError);
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
          console.error("Failed to log generation error:", logError);
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
  const generations: GenerationDTO[] = data?.map(({ user_id, source_text_hash, updated_at, ...rest }) => rest) ?? [];

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
