import type { FlashcardSource } from "../../types";

/**
 * Transform database flashcard to DTO (removes user_id)
 * @param flashcard - Database flashcard with user_id
 * @returns Flashcard DTO without user_id
 */
export function transformFlashcardToDTO<
  T extends {
    user_id: string;
    source: string;
    [key: string]: unknown;
  },
>(flashcard: T): Omit<T, "user_id"> & { source: FlashcardSource } {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...rest } = flashcard;
  return {
    ...rest,
    source: rest.source as FlashcardSource,
  };
}

/**
 * Transform multiple database flashcards to DTOs
 * @param flashcards - Array of database flashcards
 * @returns Array of flashcard DTOs
 */
export function transformFlashcardsToDTO<
  T extends {
    user_id: string;
    source: string;
    [key: string]: unknown;
  },
>(flashcards: T[]): (Omit<T, "user_id"> & { source: FlashcardSource })[] {
  return flashcards.map((flashcard) => transformFlashcardToDTO(flashcard));
}

/**
 * Count flashcards by source type
 * @param flashcards - Array of flashcards with source
 * @returns Count object with ai-full and ai-edited counts
 */
export function countBySource(flashcards: { source: FlashcardSource }[]): {
  aiFullCount: number;
  aiEditedCount: number;
  manualCount: number;
} {
  return flashcards.reduce(
    (acc, card) => {
      if (card.source === "ai-full") {
        acc.aiFullCount++;
      } else if (card.source === "ai-edited") {
        acc.aiEditedCount++;
      } else if (card.source === "manual") {
        acc.manualCount++;
      }
      return acc;
    },
    { aiFullCount: 0, aiEditedCount: 0, manualCount: 0 }
  );
}
