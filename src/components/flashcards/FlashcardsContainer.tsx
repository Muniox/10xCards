import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useFlashcards } from "../hooks/useFlashcards";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { FlashcardList } from "./FlashcardList";
import { PaginationControls } from "./PaginationControls";
import { CreateEditFlashcardDialog } from "./CreateEditFlashcardDialog";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import type { FlashcardsContainerProps, DialogMode, FlashcardFormData } from "@/types/flashcards-view.types";
import type { FlashcardDTO } from "@/types";

/**
 * Main container component for the flashcards view
 * Manages state, business logic, and API communication
 * Coordinates all CRUD operations and dialog interactions
 */
export function FlashcardsContainer({ initialData, userId }: FlashcardsContainerProps) {
  const {
    flashcards,
    pagination,
    isLoading,
    error,
    loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    optimisticallyDeletedIds,
  } = useFlashcards(userId, initialData);

  // Dialog states
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDTO | null>(null);

  /**
   * Handle opening create dialog
   */
  const handleCreateClick = useCallback(() => {
    setDialogMode("create");
    setEditingFlashcard(null);
    setIsCreateEditDialogOpen(true);
  }, []);

  /**
   * Handle opening edit dialog
   */
  const handleEditClick = useCallback((flashcard: FlashcardDTO) => {
    setDialogMode("edit");
    setEditingFlashcard(flashcard);
    setIsCreateEditDialogOpen(true);
  }, []);

  /**
   * Handle opening delete dialog
   */
  const handleDeleteClick = useCallback((flashcard: FlashcardDTO) => {
    setDeletingFlashcard(flashcard);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle create/edit form submission
   */
  const handleCreateEditSubmit = useCallback(
    async (data: FlashcardFormData) => {
      try {
        if (dialogMode === "create") {
          await createFlashcard(data);
          toast.success("Fiszka została utworzona");
        } else if (editingFlashcard) {
          await updateFlashcard(editingFlashcard.id, data);
          toast.success("Fiszka została zaktualizowana");
        }
        setIsCreateEditDialogOpen(false);
        setEditingFlashcard(null);
      } catch (error) {
        // Error is already set in the hook and will be displayed in the dialog
        throw error;
      }
    },
    [dialogMode, editingFlashcard, createFlashcard, updateFlashcard]
  );

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingFlashcard) return;

    try {
      await deleteFlashcard(deletingFlashcard.id);
      toast.success("Fiszka została usunięta");
      setIsDeleteDialogOpen(false);
      setDeletingFlashcard(null);
    } catch (error) {
      toast.error("Nie udało się usunąć fiszki");
      setIsDeleteDialogOpen(false);
      setDeletingFlashcard(null);
    }
  }, [deletingFlashcard, deleteFlashcard]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    async (page: number) => {
      try {
        await loadFlashcards(page);
      } catch (error) {
        toast.error("Nie udało się załadować fiszek");
      }
    },
    [loadFlashcards]
  );

  /**
   * Handle closing create/edit dialog
   */
  const handleCreateEditDialogClose = useCallback(() => {
    setIsCreateEditDialogOpen(false);
    setEditingFlashcard(null);
  }, []);

  /**
   * Handle closing delete dialog
   */
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeletingFlashcard(null);
  }, []);

  // Filter out optimistically deleted flashcards
  const visibleFlashcards = flashcards.filter((fc) => !optimisticallyDeletedIds.has(fc.id));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <FlashcardsHeader onCreateClick={handleCreateClick} />

      {error && !isLoading && flashcards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => loadFlashcards(pagination.page)}
            className="text-sm underline hover:no-underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {!error && (
        <>
          <FlashcardList
            flashcards={visibleFlashcards}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onCreateClick={handleCreateClick}
            isLoading={isLoading}
          />

          {!isLoading && pagination.total_pages > 1 && (
            <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
          )}
        </>
      )}

      <CreateEditFlashcardDialog
        isOpen={isCreateEditDialogOpen}
        mode={dialogMode}
        flashcard={editingFlashcard || undefined}
        onClose={handleCreateEditDialogClose}
        onSubmit={handleCreateEditSubmit}
      />

      <DeleteFlashcardDialog
        isOpen={isDeleteDialogOpen}
        flashcard={deletingFlashcard}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
