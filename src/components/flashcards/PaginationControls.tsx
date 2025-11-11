import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationControlsProps } from "@/types/flashcards-view.types";

/**
 * Pagination controls component
 * Displays current page info and navigation buttons
 */
export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const isPreviousDisabled = pagination.page === 1;
  const isNextDisabled = pagination.page >= pagination.total_pages || pagination.total === 0;

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">
          Strona {pagination.page} z {pagination.total_pages}
        </span>
        <span className="hidden sm:inline">•</span>
        <span>
          Wyświetlono {startItem}-{endItem} z {pagination.total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={isPreviousDisabled}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Poprzednia
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={isNextDisabled}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
