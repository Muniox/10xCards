import { FlashcardCard } from "./FlashcardCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlashcardListProps } from "@/types/flashcards-view.types";

/**
 * Component responsible for rendering the list of flashcards or empty state
 * Handles loading state with skeleton loaders
 */
export function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
  onCreateClick,
  isLoading,
}: FlashcardListProps) {
  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Show empty state when no flashcards
  if (flashcards.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  // Render flashcards grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((flashcard) => (
        <FlashcardCard
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={() => onEdit(flashcard)}
          onDelete={() => onDelete(flashcard)}
        />
      ))}
    </div>
  );
}
