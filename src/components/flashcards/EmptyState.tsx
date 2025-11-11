import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types/flashcards-view.types";

/**
 * Empty state component displayed when user has no flashcards
 * Encourages creating the first flashcard
 */
export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych fiszek</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Stwórz swoją pierwszą fiszkę, aby rozpocząć naukę
      </p>
      <Button onClick={onCreateClick} size="lg">
        Stwórz pierwszą fiszkę
      </Button>
    </div>
  );
}
