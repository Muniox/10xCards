import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

interface SuggestionItemProps {
  suggestion: SuggestionViewModel;
  onUpdate: (updatedSuggestion: SuggestionViewModel) => void;
  onToggleSelect: (id: string) => void;
}

export default function SuggestionItem({
  suggestion,
  onUpdate,
  onToggleSelect,
}: SuggestionItemProps) {
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...suggestion,
      front: e.target.value,
    });
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...suggestion,
      back: e.target.value,
    });
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      onToggleSelect(suggestion.id);
    }
  };

  // Sprawdzenie czy fiszka została zmodyfikowana
  const wasEdited =
    suggestion.front !== suggestion.originalFront ||
    suggestion.back !== suggestion.originalBack;

  return (
    <Card className={suggestion.isSelected ? "border-primary" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`select-${suggestion.id}`}
            checked={suggestion.isSelected}
            onCheckedChange={handleCheckboxChange}
            aria-label="Zaznacz fiszkę do zapisu"
          />
          <label
            htmlFor={`select-${suggestion.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {wasEdited && (
              <span className="text-orange-600 mr-2" title="Fiszka została zmodyfikowana">
                (edytowano)
              </span>
            )}
            Zaznacz do zapisu
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor={`front-${suggestion.id}`}
            className="block text-sm font-medium mb-2"
          >
            Przód fiszki
          </label>
          <Textarea
            id={`front-${suggestion.id}`}
            value={suggestion.front}
            onChange={handleFrontChange}
            placeholder="Pytanie lub pojęcie"
            className="min-h-[80px]"
            aria-label="Przód fiszki"
          />
        </div>
        <div>
          <label
            htmlFor={`back-${suggestion.id}`}
            className="block text-sm font-medium mb-2"
          >
            Tył fiszki
          </label>
          <Textarea
            id={`back-${suggestion.id}`}
            value={suggestion.back}
            onChange={handleBackChange}
            placeholder="Odpowiedź lub definicja"
            className="min-h-[80px]"
            aria-label="Tył fiszki"
          />
        </div>
      </CardContent>
    </Card>
  );
}
