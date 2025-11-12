import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

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
  onDelete: (id: string) => void;
}

export default function SuggestionItem({ suggestion, onUpdate, onToggleSelect, onDelete }: SuggestionItemProps) {
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSave = () => {
    setIsEditing(false);
    // Toggle selection when saving
    onToggleSelect(suggestion.id);
  };

  const handleDelete = () => {
    onDelete(suggestion.id);
  };

  // Sprawdzenie czy fiszka została zmodyfikowana
  const wasEdited = suggestion.front !== suggestion.originalFront || suggestion.back !== suggestion.originalBack;

  return (
    <Card className={`relative h-[450px] flex flex-col ${suggestion.isSelected ? "border-primary" : ""}`}>
      {/* Action buttons in top right corner */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(!isEditing)}
          title="Edytuj"
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleSave} title="Zapisz" className="h-8 w-8 p-0">
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          title="Usuń"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-3 pr-28">
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
      <CardContent className="space-y-4 flex-1">
        <div>
          <label htmlFor={`front-${suggestion.id}`} className="block text-sm font-medium mb-2">
            Przód fiszki
          </label>
          <Textarea
            id={`front-${suggestion.id}`}
            value={suggestion.front}
            onChange={handleFrontChange}
            placeholder="Pytanie lub pojęcie"
            className="h-[120px] resize-none overflow-y-auto"
            aria-label="Przód fiszki"
            disabled={!isEditing}
          />
        </div>
        <div>
          <label htmlFor={`back-${suggestion.id}`} className="block text-sm font-medium mb-2">
            Tył fiszki
          </label>
          <Textarea
            id={`back-${suggestion.id}`}
            value={suggestion.back}
            onChange={handleBackChange}
            placeholder="Odpowiedź lub definicja"
            className="h-[120px] resize-none overflow-y-auto"
            aria-label="Tył fiszki"
            disabled={!isEditing}
          />
        </div>
      </CardContent>
    </Card>
  );
}
