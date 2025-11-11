import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardDTO,
  PaginatedFlashcardsResponse,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  BulkCreateFlashcardsCommand,
  BulkCreateFlashcardsResponse,
  FlashcardSource,
} from "../../types";

/**
 * List flashcards with filtering and pagination
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param filters - Optional filters for source and generation_id
 * @param pagination - Page number and limit
 * @returns Paginated flashcard list
 */
export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    source?: FlashcardSource;
    generation_id?: number;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<PaginatedFlashcardsResponse> {
  // Build query with user filter
  let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply optional filters
  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.generation_id !== undefined) {
    query = query.eq("generation_id", filters.generation_id);
  }

  // Calculate offset and apply pagination
  const offset = (pagination.page - 1) * pagination.limit;
  query = query.range(offset, offset + pagination.limit - 1).order("created_at", { ascending: false });

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list flashcards: ${error.message}`);
  }

  // Transform to DTOs (omit user_id)
  const flashcards: FlashcardDTO[] =
    data?.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...rest } = item;
      return {
        ...rest,
        source: rest.source as FlashcardSource,
      };
    }) ?? [];

  // Calculate pagination metadata
  const total = count ?? 0;
  const total_pages = Math.ceil(total / pagination.limit);

  return {
    data: flashcards,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages,
    },
  };
}

/**
 * Get a single flashcard by ID
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param flashcardId - Flashcard ID
 * @returns Flashcard DTO or null if not found
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number
): Promise<FlashcardDTO | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // Check if it's a "not found" error
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get flashcard: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Transform to DTO (omit user_id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...rest } = data;
  return {
    ...rest,
    source: rest.source as FlashcardSource,
  };
}

/**
 * Create a manual flashcard
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param command - Flashcard creation data
 * @returns Created flashcard DTO
 */
export async function createManualFlashcard(
  supabase: SupabaseClient,
  userId: string,
  command: CreateFlashcardCommand
): Promise<FlashcardDTO> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front: command.front,
      back: command.back,
      source: "manual",
      generation_id: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create flashcard: ${error.message}`);
  }

  // Transform to DTO (omit user_id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...rest } = data;
  return {
    ...rest,
    source: rest.source as FlashcardSource,
  };
}

/**
 * Bulk create flashcards from AI generation
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param command - Bulk creation data with generation_id and flashcards
 * @returns Bulk creation response with created flashcards
 */
export async function bulkCreateFlashcards(
  supabase: SupabaseClient,
  userId: string,
  command: BulkCreateFlashcardsCommand
): Promise<BulkCreateFlashcardsResponse> {
  // First, verify the generation exists and belongs to the user
  const { data: generation, error: genError } = await supabase
    .from("generations")
    .select("id")
    .eq("id", command.generation_id)
    .eq("user_id", userId)
    .single();

  if (genError || !generation) {
    throw new Error("Generation not found");
  }

  // Prepare flashcards for insertion
  const flashcardsToInsert = command.flashcards.map((card) => ({
    user_id: userId,
    front: card.front,
    back: card.back,
    source: card.source,
    generation_id: command.generation_id,
  }));

  // Insert flashcards
  const { data, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

  if (error) {
    throw new Error(`Failed to bulk create flashcards: ${error.message}`);
  }

  // Count acceptance types for updating generation
  const aiFullCount = command.flashcards.filter((c) => c.source === "ai-full").length;
  const aiEditedCount = command.flashcards.filter((c) => c.source === "ai-edited").length;

  // Get current generation counts
  const { data: currentGen, error: fetchError } = await supabase
    .from("generations")
    .select("accepted_unedited_count, accepted_edited_count")
    .eq("id", command.generation_id)
    .single();

  if (!fetchError && currentGen) {
    // Increment existing counts instead of replacing them
    const newUneditedCount = (currentGen.accepted_unedited_count || 0) + aiFullCount;
    const newEditedCount = (currentGen.accepted_edited_count || 0) + aiEditedCount;

    // Update generation acceptance counts
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        accepted_unedited_count: newUneditedCount,
        accepted_edited_count: newEditedCount,
      })
      .eq("id", command.generation_id);

    if (updateError) {
      // Log error but don't fail the operation - errors already handled elsewhere
      // This is informational only for debugging generation statistics
    }
  }

  // Transform to DTOs
  const flashcards: FlashcardDTO[] = data.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...rest } = item;
    return {
      ...rest,
      source: rest.source as FlashcardSource,
    };
  });

  return {
    created_count: flashcards.length,
    flashcards,
  };
}

/**
 * Update a flashcard
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param flashcardId - Flashcard ID to update
 * @param command - Update data (partial)
 * @returns Updated flashcard DTO
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number,
  command: UpdateFlashcardCommand
): Promise<FlashcardDTO | null> {
  // First, fetch the current flashcard to determine source change
  const current = await getFlashcardById(supabase, userId, flashcardId);

  if (!current) {
    return null;
  }

  // Determine new source: if current is 'ai-full', change to 'ai-edited'
  const newSource = current.source === "ai-full" ? "ai-edited" : current.source;

  // Build update object
  const updateData: Record<string, unknown> = {
    ...command,
    source: newSource,
  };

  // Execute update
  const { data, error } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to update flashcard: ${error.message}`);
  }

  // If source changed from ai-full to ai-edited, update generation counts
  if (current.source === "ai-full" && newSource === "ai-edited" && current.generation_id) {
    const { data: currentGen } = await supabase
      .from("generations")
      .select("accepted_unedited_count, accepted_edited_count")
      .eq("id", current.generation_id)
      .single();

    if (currentGen) {
      await supabase
        .from("generations")
        .update({
          accepted_unedited_count: Math.max(0, (currentGen.accepted_unedited_count || 0) - 1),
          accepted_edited_count: (currentGen.accepted_edited_count || 0) + 1,
        })
        .eq("id", current.generation_id);
    }
  }

  // Transform to DTO
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...rest } = data;
  return {
    ...rest,
    source: rest.source as FlashcardSource,
  };
}

/**
 * Delete a flashcard
 * @param supabase - Supabase client instance
 * @param userId - User ID (currently hardcoded for testing)
 * @param flashcardId - Flashcard ID to delete
 * @returns true if deleted, false if not found
 */
export async function deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: number): Promise<boolean> {
  // First, fetch the flashcard to get its generation_id and source
  const flashcard = await getFlashcardById(supabase, userId, flashcardId);

  if (!flashcard) {
    return false;
  }

  // Delete the flashcard
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("id", flashcardId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  const deleted = (count ?? 0) > 0;

  // If deleted and has generation_id, update generation counts
  if (deleted && flashcard.generation_id) {
    const { data: currentGen } = await supabase
      .from("generations")
      .select("accepted_unedited_count, accepted_edited_count")
      .eq("id", flashcard.generation_id)
      .single();

    if (currentGen) {
      const updates: { accepted_unedited_count?: number; accepted_edited_count?: number } = {};

      if (flashcard.source === "ai-full") {
        updates.accepted_unedited_count = Math.max(0, (currentGen.accepted_unedited_count || 0) - 1);
      } else if (flashcard.source === "ai-edited") {
        updates.accepted_edited_count = Math.max(0, (currentGen.accepted_edited_count || 0) - 1);
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("generations").update(updates).eq("id", flashcard.generation_id);
      }
    }
  }

  return deleted;
}
