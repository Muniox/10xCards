import { useState, useCallback } from "react";
import type {
  FlashcardDTO,
  PaginatedFlashcardsResponse,
  PaginationMeta,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
} from "../../types";
import type { FlashcardFormData } from "../../types/flashcards-view.types";

interface UseFlashcardsReturn {
  flashcards: FlashcardDTO[];
  pagination: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  loadFlashcards: (page: number) => Promise<void>;
  createFlashcard: (data: FlashcardFormData) => Promise<void>;
  updateFlashcard: (id: number, data: FlashcardFormData) => Promise<void>;
  deleteFlashcard: (id: number) => Promise<void>;
  optimisticallyDeletedIds: Set<number>;
}

/**
 * Custom hook for managing flashcards state and API interactions
 * Handles CRUD operations, pagination, and optimistic UI updates
 */
export function useFlashcards(
  userId: string,
  initialData: PaginatedFlashcardsResponse
): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationMeta>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<number>>(new Set());

  /**
   * Load flashcards for a specific page
   */
  const loadFlashcards = useCallback(
    async (page: number) => {
      if (!userId) {
        setError("User ID is required");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/flashcards?page=${page}&limit=${pagination.limit}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch flashcards");
        }

        const data: PaginatedFlashcardsResponse = await response.json();
        setFlashcards(data.data);
        setPagination(data.pagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, pagination.limit]
  );

  /**
   * Create a new flashcard
   */
  const createFlashcard = useCallback(
    async (data: FlashcardFormData) => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      setError(null);

      try {
        const command: CreateFlashcardCommand = {
          front: data.front.trim(),
          back: data.back.trim(),
        };

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to create flashcard");
        }

        const newFlashcard: FlashcardDTO = await response.json();

        // Reload first page to show new flashcard
        await loadFlashcards(1);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      }
    },
    [userId, loadFlashcards]
  );

  /**
   * Update an existing flashcard
   */
  const updateFlashcard = useCallback(
    async (id: number, data: FlashcardFormData) => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      setError(null);

      try {
        const command: UpdateFlashcardCommand = {
          front: data.front.trim(),
          back: data.back.trim(),
        };

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to update flashcard");
        }

        const updatedFlashcard: FlashcardDTO = await response.json();

        // Update flashcard in current list
        setFlashcards((prev) =>
          prev.map((fc) => (fc.id === updatedFlashcard.id ? updatedFlashcard : fc))
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      }
    },
    [userId]
  );

  /**
   * Delete a flashcard with optimistic UI
   */
  const deleteFlashcard = useCallback(
    async (id: number) => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Optimistic UI - hide flashcard immediately
      setOptimisticallyDeletedIds((prev) => new Set(prev).add(id));
      setError(null);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to delete flashcard");
        }

        // Success - remove from list permanently
        const newFlashcards = flashcards.filter((fc) => fc.id !== id);
        setFlashcards(newFlashcards);

        // If we deleted the last flashcard on this page and we're not on page 1
        if (newFlashcards.length === 0 && pagination.page > 1) {
          await loadFlashcards(pagination.page - 1);
        } else if (newFlashcards.length === 0 && pagination.page === 1) {
          // We're on page 1 and no flashcards left - update pagination
          setPagination((prev) => ({ ...prev, total: 0, total_pages: 0 }));
        }
      } catch (err) {
        // Error - revert optimistic UI
        setOptimisticallyDeletedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      }
    },
    [userId, flashcards, pagination, loadFlashcards]
  );

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    optimisticallyDeletedIds,
  };
}
