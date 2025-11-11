import type { FlashcardDTO, PaginatedFlashcardsResponse, PaginationMeta } from "../types";

// ============================================================================
// Dialog and Form Types
// ============================================================================

/**
 * Mode for the Create/Edit dialog
 */
export type DialogMode = "create" | "edit";

/**
 * Form data for creating or editing a flashcard
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Form validation errors
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the main FlashcardsContainer component
 */
export interface FlashcardsContainerProps {
  initialData: PaginatedFlashcardsResponse;
  userId: string;
}

/**
 * Props for the FlashcardsHeader component
 */
export interface FlashcardsHeaderProps {
  onCreateClick: () => void;
}

/**
 * Props for the FlashcardList component
 */
export interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
  onCreateClick: () => void;
  isLoading: boolean;
}

/**
 * Props for the FlashcardCard component
 */
export interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => void;
  isOptimisticallyDeleted?: boolean;
}

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  onCreateClick: () => void;
}

/**
 * Props for the PaginationControls component
 */
export interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/**
 * Props for the CreateEditFlashcardDialog component
 */
export interface CreateEditFlashcardDialogProps {
  isOpen: boolean;
  mode: DialogMode;
  flashcard?: FlashcardDTO;
  onClose: () => void;
  onSubmit: (data: FlashcardFormData) => Promise<void>;
}

/**
 * Props for the DeleteFlashcardDialog component
 */
export interface DeleteFlashcardDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
