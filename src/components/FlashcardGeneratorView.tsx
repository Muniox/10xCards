import { useState } from "react";
import type {
  GenerationResultDTO,
  BulkCreateFlashcardsCommand,
  FlashcardForBulkCreate,
  BulkCreateFlashcardsResponse
} from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SuggestionList from "./SuggestionList";
import { useFetch } from "./hooks/useFetch";

/**
 * ViewModel dla pojedynczej sugestii fiszki w UI.
 * Rozszerza standardową sugestię o stan potrzebny do interakcji.
 */
interface SuggestionViewModel {
  id: string; // Unikalny identyfikator po stronie klienta (np. z crypto.randomUUID())
  front: string; // Aktualna treść przodu fiszki (może być edytowana)
  back: string; // Aktualna treść tyłu fiszki (może być edytowana)
  isSelected: boolean; // Czy fiszka jest zaznaczona do zapisu

  // Pola do śledzenia, czy fiszka została zmodyfikowana przez użytkownika
  originalFront: string;
  originalBack: string;
}

export default function FlashcardGeneratorView() {
  // Zarządzanie stanem lokalnym
  const [sourceText, setSourceText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<SuggestionViewModel[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);

  // Hooki useFetch dla obu operacji API
  const generateFetch = useFetch<GenerationResultDTO>();
  const saveFetch = useFetch<BulkCreateFlashcardsResponse>();

  // Walidacja długości tekstu (1000-10000 znaków)
  const isTextValid = sourceText.length >= 1000 && sourceText.length <= 10000;
  const textLength = sourceText.length;

  // Sprawdzenie czy są jakieś zaznaczone fiszki
  const hasSelectedFlashcards = suggestions.some((s) => s.isSelected);

  // Handler dla aktualizacji sugestii
  const handleUpdateSuggestion = (updatedSuggestion: SuggestionViewModel) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === updatedSuggestion.id ? updatedSuggestion : s))
    );
  };

  // Handler dla zaznaczania/odznaczania sugestii
  const handleToggleSelect = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isSelected: !s.isSelected } : s))
    );
  };

  // Handler dla generowania fiszek
  const handleGenerate = async () => {
    if (!isTextValid) return;

    const result = await generateFetch.execute("/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_text: sourceText,
      }),
    });

    if (result) {
      // Mapowanie FlashcardSuggestion[] na SuggestionViewModel[]
      const viewModels: SuggestionViewModel[] = result.suggestions.map((suggestion) => ({
        id: crypto.randomUUID(),
        front: suggestion.front,
        back: suggestion.back,
        isSelected: false,
        originalFront: suggestion.front,
        originalBack: suggestion.back,
      }));

      setSuggestions(viewModels);
      setGenerationId(result.generation_id);
    }
  };

  // Handler dla zapisywania wybranych fiszek
  const handleSaveSelected = async () => {
    if (!hasSelectedFlashcards || !generationId) return;

    // Przygotowanie danych do wysłania
    const selectedSuggestions = suggestions.filter((s) => s.isSelected);
    const flashcards: FlashcardForBulkCreate[] = selectedSuggestions.map((suggestion) => {
      // Sprawdzenie czy fiszka została zmodyfikowana
      const wasEdited =
        suggestion.front !== suggestion.originalFront ||
        suggestion.back !== suggestion.originalBack;

      return {
        front: suggestion.front,
        back: suggestion.back,
        source: wasEdited ? "ai-edited" : "ai-full",
      };
    });

    const command: BulkCreateFlashcardsCommand = {
      generation_id: generationId,
      flashcards,
    };

    const result = await saveFetch.execute("/api/flashcards/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (result) {
      // Wyświetl Toast z sukcesem
      toast.success(`Zapisano ${flashcards.length} fiszek`);

      // Reset widoku po pomyślnym zapisie
      setSourceText("");
      setSuggestions([]);
      setGenerationId(null);
      generateFetch.reset();
      saveFetch.reset();
    } else if (saveFetch.error) {
      // Wyświetl Toast z błędem
      toast.error(saveFetch.error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-6">Generator Fiszek</h1>

      {/* Pole tekstowe na tekst źródłowy */}
      <div className="mb-6">
        <label htmlFor="source-text" className="block text-sm font-medium mb-2">
          Tekst źródłowy
        </label>
        <Textarea
          id="source-text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (1000-10000 znaków)..."
          className="min-h-[200px]"
          disabled={generateFetch.loading}
        />
        <div className="flex justify-between items-center mt-2">
          <span
            className={`text-sm ${
              isTextValid ? "text-green-600" : "text-gray-500"
            }`}
          >
            {textLength} / 10000 znaków
          </span>
          {!isTextValid && textLength > 0 && (
            <span className="text-sm text-red-600">
              {textLength < 1000
                ? `Potrzebujesz jeszcze ${1000 - textLength} znaków`
                : `Przekroczono limit o ${textLength - 10000} znaków`}
            </span>
          )}
        </div>
      </div>

      {/* Przycisk "Generuj" */}
      <div className="mb-6">
        <Button
          onClick={handleGenerate}
          disabled={!isTextValid || generateFetch.loading}
          className="w-full"
        >
          {generateFetch.loading ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </div>

      {/* Lista sugestii z SuggestionList */}
      <SuggestionList
        suggestions={suggestions}
        isLoading={generateFetch.loading}
        error={generateFetch.error}
        onUpdate={handleUpdateSuggestion}
        onToggleSelect={handleToggleSelect}
      />

      {/* Przycisk "Zapisz wybrane" - widoczny tylko gdy są sugestie i nie jest ładowanie */}
      {suggestions.length > 0 && !generateFetch.loading && (
        <div className="mt-6">
          <Button
            onClick={handleSaveSelected}
            disabled={!hasSelectedFlashcards || saveFetch.loading}
            className="w-full"
          >
            {saveFetch.loading
              ? "Zapisywanie..."
              : `Zapisz wybrane (${suggestions.filter(s => s.isSelected).length})`}
          </Button>
        </div>
      )}
    </div>
  );
}
