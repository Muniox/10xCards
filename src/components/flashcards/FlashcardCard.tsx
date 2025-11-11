import { MoreVertical, Pencil, Trash } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { FlashcardCardProps } from "@/types/flashcards-view.types";

/**
 * Component representing a single flashcard card
 * Displays front and back text with edit/delete actions
 */
export function FlashcardCard({ flashcard, onEdit, onDelete, isOptimisticallyDeleted = false }: FlashcardCardProps) {
  // Hide card if optimistically deleted
  if (isOptimisticallyDeleted) {
    return null;
  }

  return (
    <Card className="relative group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Przód</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Otwórz menu akcji">
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">{flashcard.front}</p>
        </div>
        <div className="pt-2 border-t">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Tył</h4>
          <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">{flashcard.back}</p>
        </div>
        {flashcard.source && (
          <div className="pt-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                flashcard.source === "manual"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : flashcard.source === "ai-full"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }`}
            >
              {flashcard.source === "manual" ? "Ręczna" : flashcard.source === "ai-full" ? "AI" : "AI Edytowana"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
