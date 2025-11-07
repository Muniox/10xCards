import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SuggestionItem from "./SuggestionItem";

/**
 * ViewModel dla pojedynczej sugestii fiszki w UI.
 */
interface SuggestionViewModel {
  id: string;
  front: string;
  back: string;
  isSelected: boolean;
  originalFront: string;
  originalBack: string;
}

interface SuggestionListProps {
  suggestions: SuggestionViewModel[];
  isLoading: boolean;
  error: string | null;
  onUpdate: (updatedSuggestion: SuggestionViewModel) => void;
  onToggleSelect: (id: string) => void;
}

export default function SuggestionList({
  suggestions,
  isLoading,
  error,
  onUpdate,
  onToggleSelect,
}: SuggestionListProps) {
  // Stan ładowania - wyświetl Skeletony
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Generowanie fiszek">
        <p className="text-lg font-medium text-gray-700">
          Generowanie fiszek...
        </p>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div
        className="p-6 bg-red-50 border border-red-200 rounded-lg"
        role="alert"
        aria-live="assertive"
      >
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Wystąpił błąd
        </h3>
        <p className="text-red-700">{error}</p>
        <p className="text-red-600 text-sm mt-2">
          Spróbuj ponownie lub skontaktuj się z pomocą techniczną.
        </p>
      </div>
    );
  }

  // Pusta lista
  if (suggestions.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">
          Nie udało się wygenerować żadnych propozycji dla tego tekstu.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Spróbuj z innym tekstem źródłowym.
        </p>
      </div>
    );
  }

  // Lista sugestii
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">
          Propozycje fiszek ({suggestions.length})
        </h2>
        <p className="text-sm text-gray-600">
          Zaznaczono: {suggestions.filter((s) => s.isSelected).length}
        </p>
      </div>
      <div className="space-y-4" role="list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} role="listitem">
            <SuggestionItem
              suggestion={suggestion}
              onUpdate={onUpdate}
              onToggleSelect={onToggleSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
