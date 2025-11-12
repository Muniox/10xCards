import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeleteFlashcardDialogProps } from "@/types/flashcards-view.types";

/**
 * Alert dialog for confirming flashcard deletion
 * Shows warning message and optional flashcard preview
 */
export function DeleteFlashcardDialog({ isOpen, flashcard, onClose, onConfirm }: DeleteFlashcardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      // Silently handle error - parent component is responsible for error handling
      // This prevents unhandled promise rejections in tests
      void error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {flashcard && (
          <div className="rounded-lg border bg-muted/50 p-4 my-2">
            <p className="text-sm font-medium mb-1">Przód:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{flashcard.front}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
