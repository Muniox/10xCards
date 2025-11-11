import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlashcardsHeaderProps } from "@/types/flashcards-view.types";

/**
 * Header component for flashcards view
 * Contains page title and create button
 */
export function FlashcardsHeader({ onCreateClick }: FlashcardsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Moje Fiszki</h1>
      <Button onClick={onCreateClick} size="default">
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Dodaj fiszkę
      </Button>
    </div>
  );
}
